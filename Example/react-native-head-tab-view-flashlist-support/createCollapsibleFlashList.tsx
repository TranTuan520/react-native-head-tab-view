import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useState,
} from 'react';
import {ScrollableView} from 'react-native-head-tab-view-flashlist-support/types';
import {Platform, StyleSheet, ScrollViewProps, View} from 'react-native';
import RefreshControlContainer from 'react-native-head-tab-view-flashlist-support/RefreshControlContainer';
import {
  NativeViewGestureHandler,
  ScrollView,
} from 'react-native-gesture-handler';
import {
  NormalSceneProps,
  HPageViewProps,
} from 'react-native-head-tab-view-flashlist-support/types';
import {
  useSceneContext,
  useSharedScrollableRef,
  useSyncInitialPosition,
  useRefreshDerivedValue,
  useVerifyProps,
} from 'react-native-head-tab-view-flashlist-support/hook';
import {
  mScrollTo,
  animateToRefresh,
  snapAfterGlideOver,
} from 'react-native-head-tab-view-flashlist-support/utils';
import Animated, {
  runOnJS,
  useDerivedValue,
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  cancelAnimation,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
const __IOS = Platform.OS === 'ios';

const createCollapsibleFlashList = (Component: ScrollableView<any>) => {
  const AnimatePageView = Animated.createAnimatedComponent(Component);
  return React.forwardRef((props: any, ref) => {
    return (
      <SceneComponent
        {...props}
        forwardedRef={ref}
        ContainerView={AnimatePageView}
      />
    );
  });
};

const SceneComponent: React.FC<NormalSceneProps & HPageViewProps> = ({
  index,
  bounces,
  scrollEnabled = true,
  forwardedRef,
  onScroll,
  onStartRefresh,
  onContentSizeChange,
  onScrollBeginDrag,
  renderLoadingView,
  ContainerView,
  isRefreshing: _isRefreshing = false,
  renderRefreshControl: _renderRefreshControl,
  StickyHeaderComponent,
  ...restProps
}) => {
  if (onScroll !== undefined) {
    console.warn('Please do not assign onScroll');
  }
  const {
    shareAnimatedValue = useSharedValue(0),
    tabbarHeight,
    headerHeight,
    expectHeight,
    tabsRefreshEnabled,
    curIndexValue,
    tabsIsWorking,
    isTouchTabs,
    isSlidingHeader,
    refreshHeight,
    overflowPull,
    frozeTop,
    pullExtendedCoefficient,
    enableSnap,
    scrollingCheckDuration,
    refHasChanged,
    updateSceneInfo,
    floatingButtonHeight,
  } = useSceneContext();

  const _scrollView = useSharedScrollableRef<ScrollView>(forwardedRef);
  const panRef = useRef();
  const scrollY = useSharedValue(0);
  const realY = useSharedValue(0);
  const trans = useSharedValue(0);
  const refreshTrans = useSharedValue(refreshHeight);
  const isTouchTabsPrev = useSharedValue(false);
  const isSlidingHeaderPrev = useSharedValue(false);
  const isRefreshing = useSharedValue(false);
  const isRefreshingWithAnimation = useSharedValue(false);
  const isDragging: {value: boolean} = useSharedValue(false);
  const isLosingMomentum: {value: boolean} = useSharedValue(false);
  const {opacityValue, syncInitialPosition} =
    useSyncInitialPosition(_scrollView);
  const needSnap = useSharedValue(false);
  const isScrolling = useSharedValue(0);
  const calcHeight = useMemo(() => {
    return tabbarHeight + headerHeight;
  }, [tabbarHeight, headerHeight]);
  const isInitial = useRef(true);
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(0);

  const scrollEnabledValue = useDerivedValue(() => {
    return (
      !isDragging.value &&
      !tabsIsWorking.value &&
      !isRefreshing.value &&
      !isRefreshingWithAnimation.value &&
      curIndexValue.value === index
    );
  });

  const canSnapFunc = () => {
    'worklet';
    return (
      needSnap.value &&
      !isTouchTabs.value &&
      !isSlidingHeader.value &&
      !isRefreshing.value &&
      !isRefreshingWithAnimation.value &&
      !tabsIsWorking.value
    );
  };

  const refreshValue = useDerivedValue(() => {
    if (isRefreshing.value && isRefreshingWithAnimation.value) {
      return refreshHeight - refreshTrans.value;
    }
    return trans.value - shareAnimatedValue.value;
  });

  useAnimatedReaction(
    () => {
      return scrollEnabledValue.value;
    },
    (mScrollEnabled) => {
      _scrollView &&
        _scrollView.current &&
        _scrollView.current.setNativeProps({scrollEnabled: mScrollEnabled});
    },
    [scrollEnabledValue, _scrollView],
  );

  const updateScrollYTrans = useCallback(
    (value: number) => {
      'worklet';
      scrollY.value = Math.max(value, 0);
    },
    [scrollY],
  );

  const updateShareValue = useCallback(
    (value: number) => {
      'worklet';
      if (curIndexValue.value !== index) return;
      //Avoid causing updates to the ShareAnimatedValue after the drop-down has finished
      if (isRefreshing.value !== isRefreshingWithAnimation.value) return;
      shareAnimatedValue.value = value;
    },
    [
      curIndexValue.value,
      shareAnimatedValue,
      index,
      isRefreshing.value,
      isRefreshingWithAnimation.value,
    ],
  );

  const tryToSnap = useCallback(() => {
    'worklet';
    if (!enableSnap) return;
    cancelAnimation(isScrolling);
    if (canSnapFunc()) {
      isScrolling.value = 1;
      isScrolling.value = withTiming(
        0,
        {duration: scrollingCheckDuration},
        (isFinished) => {
          if (isFinished && canSnapFunc()) {
            needSnap.value = false;
            snapAfterGlideOver({
              sceneRef: _scrollView,
              shareAnimatedValue,
              headerHeight,
              frozeTop,
            });
          }
        },
      );
    }
  }, [
    isScrolling.value,
    _scrollView,
    needSnap,
    shareAnimatedValue,
    headerHeight,
    frozeTop,
    enableSnap,
    scrollingCheckDuration,
  ]);

  const onScrollAnimateEvent = useAnimatedScrollHandler(
    {
      onScroll: (event, ctx) => {
        realY.value = event.contentOffset.y;
        let moveY = Math.max(event.contentOffset.y, 0);

        if (isRefreshingWithAnimation.value || isRefreshing.value) return;
        tryToSnap();
        moveY =
          isRefreshing.value && isRefreshingWithAnimation.value
            ? moveY + refreshHeight
            : moveY;
        updateScrollYTrans(moveY);
        updateShareValue(moveY);
      },
      onMomentumBegin: () => {
        isLosingMomentum.value = true;
      },
      onMomentumEnd: () => {
        isLosingMomentum.value = false;
      },
    },
    [
      curIndexValue,
      updateShareValue,
      updateScrollYTrans,
      isRefreshingWithAnimation,
      tryToSnap,
    ],
  );

  const onRefreshStatusCallback = React.useCallback(
    (isToRefresh: boolean) => {
      if (isToRefresh) {
        animateToRefresh({
          transRefreshing: refreshTrans,
          isRefreshing,
          isRefreshingWithAnimation,
          destPoi: shareAnimatedValue.value,
          isToRefresh: true,
          onStartRefresh,
        });
      } else {
        const destPoi =
          shareAnimatedValue.value > headerHeight + refreshHeight
            ? shareAnimatedValue.value
            : shareAnimatedValue.value + refreshHeight;
        animateToRefresh({
          transRefreshing: refreshTrans,
          isRefreshing,
          isRefreshingWithAnimation,
          destPoi,
          isToRefresh: false,
        });
      }
    },
    [onStartRefresh, refreshHeight, headerHeight],
  );

  useEffect(() => {
    refHasChanged && refHasChanged(panRef);
  }, [refHasChanged, panRef]);

  useEffect(() => {
    if (_scrollView && _scrollView.current) {
      updateSceneInfo({
        scrollRef: _scrollView,
        index,
        refreshTrans,
        isRefreshing,
        isRefreshingWithAnimation,
        canPullRefresh: onStartRefresh !== undefined,
        scrollY,
        isDragging,
        scrollEnabledValue,
        isLosingMomentum,
        onRefreshStatusCallback,
      });
    }
  }, [
    _scrollView,
    index,
    refreshTrans,
    isRefreshing,
    isRefreshingWithAnimation,
    onStartRefresh,
    scrollY,
    isDragging,
    onRefreshStatusCallback,
  ]);

  //adjust the scene size
  const _onContentSizeChange = useCallback(
    (contentWidth: number, contentHeight: number) => {
      onContentSizeChange && onContentSizeChange(contentWidth, contentHeight);

      //Some mobile phones measure less than their actual height. And the difference in height is not more than a pixel
      if (Math.ceil(contentHeight) >= expectHeight) {
        syncInitialPosition(
          isRefreshing.value
            ? shareAnimatedValue.value - refreshHeight
            : shareAnimatedValue.value,
        );
      }
    },
    [
      onContentSizeChange,
      syncInitialPosition,
      expectHeight,
      isRefreshing,
      refreshTrans,
      shareAnimatedValue,
    ],
  );

  //Pull-refresh
  useEffect(() => {
    if (_isRefreshing) {
      onRefreshStatusCallback(true);
    } else {
      if (isInitial.current) return;
      onRefreshStatusCallback(false);
    }
    isInitial.current = false;
  }, [_isRefreshing, onRefreshStatusCallback, isInitial]);

  //Finger off the screen
  useAnimatedReaction(
    () => {
      return isTouchTabs.value !== isTouchTabsPrev.value && enableSnap;
    },
    (result) => {
      if (!result) return;
      isTouchTabsPrev.value = isTouchTabs.value;
      if (isTouchTabs.value === true) return;

      needSnap.value = true;
      tryToSnap();
    },
    [isTouchTabs, isTouchTabsPrev, tryToSnap, enableSnap],
  );

  //Slide header over
  useAnimatedReaction(
    () => {
      return isSlidingHeader.value !== isSlidingHeaderPrev.value && enableSnap;
    },
    (result) => {
      if (!result) return;
      isSlidingHeaderPrev.value = isSlidingHeader.value;
      if (isSlidingHeader.value === true) return;

      needSnap.value = true;
      tryToSnap();
    },
    [isSlidingHeader, isSlidingHeaderPrev, tryToSnap, enableSnap],
  );

  useAnimatedReaction(
    () => {
      return refreshTrans.value;
    },
    (mTrans) => {
      trans.value = Math.max(refreshHeight - mTrans, 0);
    },
    [refreshTrans, refreshHeight],
  );

  useAnimatedReaction(
    () => {
      return (
        isRefreshing.value === false &&
        isRefreshingWithAnimation.value === true &&
        refreshTrans
      );
    },
    (isStart) => {
      if (!isStart) return;
      if (realY.value === refreshTrans.value - refreshHeight) return;
      mScrollTo(_scrollView, 0, refreshTrans.value - refreshHeight, false);
    },
    [isRefreshing, isRefreshingWithAnimation, refreshTrans, refreshHeight],
  );

  useAnimatedReaction(
    () => {
      return (
        refreshTrans.value <= refreshHeight &&
        (isDragging.value || isRefreshingWithAnimation.value)
      );
    },
    (isStart) => {
      if (!isStart) return;
      if (realY.value !== 0) {
        mScrollTo(_scrollView, 0, 0, false);
      }
    },
    [refreshTrans, refreshHeight, isDragging, isRefreshingWithAnimation],
  );

  useAnimatedReaction(
    () => {
      return (
        refreshTrans.value >= 0 &&
        isRefreshingWithAnimation.value &&
        isRefreshing.value
      );
    },
    (isStart) => {
      if (!isStart) return;
      updateScrollYTrans(refreshTrans.value);
      updateShareValue(refreshTrans.value);
    },
    [
      refreshTrans,
      refreshHeight,
      isRefreshingWithAnimation,
      isRefreshing,
      _scrollView,
      updateShareValue,
      updateScrollYTrans,
    ],
  );

  useAnimatedReaction(
    () => {
      return (
        refreshTrans.value > refreshHeight &&
        isRefreshing.value &&
        isRefreshingWithAnimation.value
      );
    },
    (start) => {
      if (!start) return;
      if (realY.value !== refreshTrans.value - refreshHeight) {
        mScrollTo(_scrollView, 0, refreshTrans.value - refreshHeight, false);
      }
    },
    [
      refreshTrans,
      refreshHeight,
      isRefreshing,
      isRefreshingWithAnimation,
      _scrollView,
    ],
  );

  const translateY = useRefreshDerivedValue({
    animatedValue: trans,
    refreshHeight,
    overflowPull,
    pullExtendedCoefficient,
  });

  const stickyHeaderAnimatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            realY.value,
            [0, calcHeight - tabbarHeight],
            [calcHeight, tabbarHeight],
            Extrapolate.CLAMP,
          ),
        },
      ],
    };
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: translateY.value,
        },
      ],
    };
  });

  const renderRefreshControl = () => {
    if (!onStartRefresh) return;
    return (
      <RefreshControlContainer
        top={calcHeight}
        refreshHeight={refreshHeight}
        overflowPull={overflowPull}
        refreshValue={refreshValue}
        opacityValue={opacityValue}
        isRefreshing={isRefreshing}
        isRefreshingWithAnimation={isRefreshingWithAnimation}
        pullExtendedCoefficient={pullExtendedCoefficient}
        renderContent={_renderRefreshControl}
      />
    );
  };

  const bouncesEnabled = useMemo(() => {
    return __IOS && !tabsRefreshEnabled && onStartRefresh === undefined;
  }, [tabsRefreshEnabled, onStartRefresh]);

  const sceneStyle = useAnimatedStyle(() => {
    return {
      opacity: opacityValue.value,
    };
  });

  return (
    <Animated.View style={[styles.container, {}]}>
      {opacityValue.value !== 1 && renderLoadingView ? (
        <Animated.View style={StyleSheet.absoluteFill}>
          {renderLoadingView(headerHeight)}
        </Animated.View>
      ) : null}
      <Animated.View style={[styles.container, sceneStyle]}>
        <Animated.View
          style={[
            styles.container,
            animatedStyle,
            {flex: 1, height: expectHeight},
          ]}>
          <MemoList
            panRef={panRef}
            ContainerView={ContainerView}
            zForwardedRef={_scrollView}
            onScroll={onScrollAnimateEvent}
            onContentSizeChange={_onContentSizeChange}
            bounces={bouncesEnabled}
            headerHeight={calcHeight}
            expectHeight={expectHeight}
            stickyHeaderHeight={stickyHeaderHeight}
            floatingButtonHeight={floatingButtonHeight}
            calcHeight={calcHeight}
            tabbarHeight={tabbarHeight}
            {...restProps}
          />
          <Animated.View
            onLayout={(event) => {
              const height = event.nativeEvent.layout.height;

              if (height) {
                setStickyHeaderHeight(height);
              }
            }}
            style={[
              {position: 'absolute', width: '100%'},
              stickyHeaderAnimatedStyles,
            ]}>
            {StickyHeaderComponent && <StickyHeaderComponent />}
          </Animated.View>
        </Animated.View>
        {renderRefreshControl()}
      </Animated.View>
    </Animated.View>
  );
};

interface SceneListComponentProps {
  panRef: any;
  ContainerView: any;
  zForwardedRef: any;
  headerHeight: number;
  expectHeight: number;
}

const SceneListComponent: React.FC<
  SceneListComponentProps & ScrollViewProps
> = ({
  panRef,
  ContainerView,
  zForwardedRef,
  headerHeight,
  expectHeight,
  scrollEventThrottle,
  directionalLockEnabled,
  contentContainerStyle,
  scrollIndicatorInsets,
  stickyHeaderHeight,
  maintainVisibleContentPosition,
  floatingButtonHeight,
  tabbarHeight,
  calcHeight,
  ...rest
}) => {
  const {
    contentContainerStyle: _contentContainerStyle,
    scrollIndicatorInsets: _scrollIndicatorInsets,
  } = useVerifyProps({
    scrollEventThrottle,
    directionalLockEnabled,
    contentContainerStyle,
    scrollIndicatorInsets,
    maintainVisibleContentPosition,
  });

  const {data} = rest;

  const [contentHeight, setContentHeight] = useState(0);

  const [itemHeight, setItemHeight] = useState(0);

  const isFirstMount = useRef(true);

  const renderItem = (props) => {
    return (
      <View
        onLayout={(event) => {
          if (isFirstMount.current) {
            const height = event.nativeEvent.layout.height;

            if (height) {
              isFirstMount.current = false;

              setItemHeight(height);
            }
          }
        }}>
        {rest.renderItem(props)}
      </View>
    );
  };

  // Todo: Improve after
  const tempHeight = useMemo(() => {
    let height = 0;

    if (
      data?.length &&
      itemHeight * data.length <
        contentHeight - tabbarHeight - stickyHeaderHeight
    ) {
      height =
        contentHeight -
        tabbarHeight -
        stickyHeaderHeight -
        itemHeight * data.length;
    }

    return height;
  }, [contentHeight, itemHeight, data, tabbarHeight, stickyHeaderHeight]);

  const ListFooterComponent = rest.ListFooterComponent;

  const ListEmptyComponent = rest.ListEmptyComponent;

  return (
    <NativeViewGestureHandler ref={panRef}>
      <ContainerView
        {...rest}
        ref={zForwardedRef}
        scrollEventThrottle={16}
        directionalLockEnabled
        renderItem={renderItem}
        contentContainerStyle={[_contentContainerStyle]}
        scrollIndicatorInsets={{
          top: headerHeight,
          ..._scrollIndicatorInsets,
        }}
        renderScrollComponent={ScrollView}
        maintainVisibleContentPosition={null}
        ListHeaderComponent={() => {
          return (
            <View>
              <View
                style={[
                  {
                    height: headerHeight + stickyHeaderHeight ?? 0,
                    justifyContent: 'flex-end',
                  },
                ]}
              />
              {rest?.ListHeaderComponent && rest?.ListHeaderComponent}
            </View>
          );
        }}
        ListEmptyComponent={() => {
          return (
            <View
              style={{
                height: contentHeight - tabbarHeight,
                width: '100%',
              }}>
              {ListEmptyComponent && <ListEmptyComponent />}
            </View>
          );
        }}
        ListFooterComponent={() => {
          return (
            <>
              {ListFooterComponent && <ListFooterComponent />}

              <View
                style={{
                  height: data?.length
                    ? tempHeight
                      ? tempHeight
                      : floatingButtonHeight ?? 0
                    : 0,
                }}
              />
            </>
          );
        }}
        onLayout={(event) => {
          const height = event.nativeEvent.layout.height;

          if (height) {
            setContentHeight(height);
          }
        }}
      />
    </NativeViewGestureHandler>
  );
};

const MemoList = memo(SceneListComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default createCollapsibleFlashList;
