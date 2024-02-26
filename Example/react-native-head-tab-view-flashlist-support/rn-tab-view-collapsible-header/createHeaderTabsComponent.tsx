import {TabView, TabViewProps, Route, TabBar} from 'react-native-tab-view';
import React, {forwardRef, useEffect, useImperativeHandle, useRef} from 'react';
import {
  GestureContainer,
  CollapsibleHeaderProps,
  GestureContainerRef,
} from 'react-native-head-tab-view-flashlist-support';
import {DeviceEventEmitter} from 'react-native';
import {
  Events,
  IgnoreScrollEnableType,
} from 'react-native-head-tab-view-flashlist-support/enum';
type ZTabViewProps<T extends Route> = Partial<TabViewProps<T>> &
  Pick<TabViewProps<T>, 'onIndexChange' | 'navigationState' | 'renderScene'> &
  CollapsibleHeaderProps;
type ForwardTabViewProps<T extends Route> = ZTabViewProps<T> & {
  forwardedRef: React.Ref<TabView<T>>;
  Component: typeof TabView;
};

export default function createHeaderTabsComponent<T extends Route>(
  Component: typeof TabView,
  config?: {},
): React.ForwardRefExoticComponent<
  React.PropsWithoutRef<ZTabViewProps<T>> & React.RefAttributes<TabView<T>>
> {
  return React.forwardRef((props: ZTabViewProps<T>, ref) => {
    const {componentId} = props ?? {};

    useImperativeHandle(ref, () => {
      return {
        scrollToTop: (params) => {
          DeviceEventEmitter.emit(Events.LIST_SCROLL_TO_TOP, {
            componentId,
            ...params,
          });
        },
        scrollToTabBar: (params) => {
          DeviceEventEmitter.emit(Events.LIST_SCROLL_DOWN_TO_TAB_BAR, {
            componentId,
            ...params,
          });
        },
        scrollToOffset: (params) => {
          DeviceEventEmitter.emit(Events.LIST_SCROLL_TO_OFFSET, {
            componentId,
            ...params,
          });
        },
      };
    });
    return (
      <CollapsibleHeaderTabView
        {...props}
        forwardedRef={ref}
        Component={Component}
      />
    );
  });
}

function CollapsibleHeaderTabView<T extends Route>(
  props: ForwardTabViewProps<T>,
): any {
  const mRef = useRef<GestureContainerRef>();
  const initialPageRef = useRef(props.navigationState.index);

  const {animationEnabled} = props ?? {};

  useEffect(() => {
    mRef.current && mRef.current.setCurrentIndex(props.navigationState.index);
  }, [props.navigationState.index]);

  const _renderTabBar = (tabbarProps: any) => {
    if (props.renderTabBar) {
      return props.renderTabBar(tabbarProps);
    }
    return <TabBar {...tabbarProps} />;
  };

  const emitIgnoreScrollEnableEvent = (eventType: String) => {
    DeviceEventEmitter.emit(Events.IGNORE_SCROLL_ENABLE, {type: eventType});
  };

  const renderTabView = (e: {renderTabBarContainer: any}) => {
    const {Component} = props;
    return (
      <Component
        ref={props.forwardedRef}
        {...props}
        renderTabBar={(tabbarProps) => {
          return e.renderTabBarContainer(
            _renderTabBar({
              ...tabbarProps,
              onTabPress: () => {
                tabbarProps?.onTabPress?.();

                if (animationEnabled !== false) {
                  emitIgnoreScrollEnableEvent(
                    IgnoreScrollEnableType.ON_TAB_PRESSED,
                  );
                }
              },
            }),
          );
        }}
        onSwipeStart={() => {
          props?.onSwipeStart?.();
          emitIgnoreScrollEnableEvent(IgnoreScrollEnableType.ON_SWIPE_START);
        }}
        onSwipeEnd={() => {
          props?.onSwipeEnd?.();
          emitIgnoreScrollEnableEvent(IgnoreScrollEnableType.ON_SWIPE_END);
        }}
      />
    );
  };

  return (
    <GestureContainer
      ref={mRef}
      initialPage={initialPageRef.current}
      renderTabView={renderTabView}
      {...props}
    />
  );
}
