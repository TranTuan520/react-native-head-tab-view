# React Native Head Tab View

A package forked from [zyslife/react-native-head-tab-view](https://github.com/zyslife/react-native-head-tab-view), which supports Shopify's FlashLish and a few little things that I think will help you 😗

```tsx
import {
  HScrollView,
  HFlatList,
  HSectionList,
  HFlashList,
} from 'react-native-head-tab-view-flashlist-support';
```

**The following components are currently supported:**  
[react-native-scrollable-tab-view](https://github.com/ptomasroos/react-native-scrollable-tab-view)

[react-native-head-tab-view](https://github.com/zyslife/react-native-head-tab-view)

[react-native-tab-view](https://github.com/satya164/react-native-tab-view)

## Demo

![demo_ios.gif](https://github.com/zyslife/react-native-head-tab-view/blob/master/demoGIF/demo_ios.gif)

## Example

If your tabs component is **react-native-scrollable-tab-view**

```js
import * as React from 'react';
import {View} from 'react-native';
import {HScrollView} from 'react-native-head-tab-view-flashlist-support';
import {CollapsibleHeaderTabView} from 'react-native-head-tab-view-flashlist-support/rn-tab-view-collapsible-header';
export default class ExampleBasic extends React.PureComponent<any> {
  render() {
    return (
      <CollapsibleHeaderTabView
        renderScrollHeader={() => (
          <View style={{height: 200, backgroundColor: 'red'}} />
        )}>
        <HScrollView index={0}>
          <View style={{height: 1000, backgroundColor: '#ff4081'}} />
        </HScrollView>
        <HScrollView index={1}>
          <View style={{height: 1000, backgroundColor: '#673ab7'}} />
        </HScrollView>
      </CollapsibleHeaderTabView>
    );
  }
}
```

If your tabs component is **react-native-tab-view**

```js
import * as React from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import {SceneMap} from 'react-native-tab-view';
import {HScrollView} from 'react-native-head-tab-view-flashlist-support';
import {CollapsibleHeaderTabView} from 'react-native-head-tab-view-flashlist-support/rn-tab-view-collapsible-header';

const FirstRoute = () => (
  <HScrollView index={0}>
    <View style={[styles.scene, {backgroundColor: '#ff4081'}]} />
  </HScrollView>
);

const SecondRoute = () => (
  <HScrollView index={1}>
    <View style={[styles.scene, {backgroundColor: '#673ab7'}]} />
  </HScrollView>
);

const initialLayout = {width: Dimensions.get('window').width};

export default function TabViewExample() {
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    {key: 'first', title: 'First'},
    {key: 'second', title: 'Second'},
  ]);

  const renderScene = SceneMap({
    first: FirstRoute,
    second: SecondRoute,
  });

  return (
    <CollapsibleHeaderTabView
      renderScrollHeader={() => (
        <View style={{height: 200, backgroundColor: 'red'}} />
      )}
      navigationState={{index, routes}}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={initialLayout}
    />
  );
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
  },
});
```

More examples：[Example](https://github.com/zyslife/react-native-head-tab-view/blob/master/Example/src)

## Run the example

```sh
cd Example
yarn or npm install

//run Android
react-native run-android

//run iOS
cd ios
pod install
cd ../
react-native run-ios
```

## Installation

- The first step is to add the base library and its dependencies

```sh
yarn add react-native-head-tab-view react-native-gesture-handler react-native-reanimated
or
npm install react-native-head-tab-view react-native-gesture-handler react-native-reanimated --save
```

##### If your tabs component is react-native-tab-view

```
yarn add react-native-tab-view-collapsible-header
```

## Linking

1. react-native-gesture-handler [Refer to the official documentation](https://github.com/software-mansion/react-native-gesture-handler)
2. react-native-reanimated [Refer to the official documentation](https://github.com/software-mansion/react-native-reanimated)

---

## Documentation

#### CollapsibleHeaderProps

##### `renderScrollHeader` _(React.ComponentType<any> | React.ReactElement | null)_ (require)

_render the collapsible header_

```js
renderScrollHeader={()=><View style={{height:180,backgroundColor:'red'}}/>}
```

##### `headerHeight` (optional)

The height of collapsible header.

##### `tabbarHeight` (optional)

The height of collapsible tabbar

##### `frozeTop`

The height at which the top area of the Tabview is frozen

##### `overflowHeight`

Sets the upward offset distance of the TabView and TabBar

##### `makeScrollTrans` _(scrollValue: Animated.ShareValue<boolean>) => void_

Gets the animation value of the shared collapsible header.

```js
<CollapsibleHeaderTabView
  makeScrollTrans={(scrollValue) => {
    this.setState({scrollValue});
  }}
/>
```

##### `onStartRefresh` _(() => void)_

If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality.  
Make sure to also set the isRefreshing prop correctly.

##### `isRefreshing` _(boolean)_

Whether the TabView is refreshing

##### `renderRefreshControl` _(() => React.ReactElement)_

A custom RefreshControl

##### `scrollEnabled` _(boolean)_

Whether to allow the scene to slide vertically

##### `refreshHeight` _(number)_

If this height is reached, a refresh event will be triggered （onStartRefresh）  
 it defaults to 80

##### `overflowPull` _(number)_

It's the distance beyond the refreshHeight, the distance to continue the displacement, when the pull is long enough,  
it defaults to 50.

##### `pullExtendedCoefficient` _(number)_

When the maximum drop-down distance is reached(refreshHeight+overflowPull), the refreshControl moves the distance for each pixel the finger moves The recommended number is between 0 and 1.

#### `FloatingButtonComponent` _(React.Element)_

Floating button will show when scroll down

#### `componentId` _(String)_

TabView's id, required if you want to use `scrollToTop()` function

#### `tabContentBackgroundColor` _(String)_

Background color of tabView's content

---

</details>

<details>
<summary>HScrollView \ HFlatList \ HSectionList \ HFlashlist</summary>

##### `index` _(number)_ (require)

The number of the screen.  
If you use **react-native-scrollable-tab-view**, it should correspond to the number of the `children` element in the TabView.

If you use **react-native-tab-view**, it should correspond to the index of the `navigationState` of the TabView  
Please check the [Example](https://github.com/zyslife/react-native-head-tab-view#Example) .

##### `onStartRefresh` _(() => void)_

If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality.  
Make sure to also set the isRefreshing prop correctly.

##### `isRefreshing` _(boolean)_

Whether the scene is refreshing

##### `renderRefreshControl` _(() => React.ComponentType<any> | React.ReactElement | null)_

A custom RefreshControl for scene

##### `renderLoadingView` _((headerHeight: number) => React.ReactElement)_

You can provide a LoadingView when the scene is transparent until the height of the onContentSizeRange callback is less than minHeight.

##### `enableSnap` _(boolean)_

When it stops sliding, it automatically switches to the folded and expanded states.

##### `StickyHeaderComponent` _(React.Element)_

Sticky component located below the tabBar

#### `LoadingComponent` _(React.Element)_

Loading view, along with `loadingVisible` props (required)

#### `loadingVisible` _(boolean)_

</details>

## Tips.

1. With HFlashlist, some props like( maintainVisibleContentPosition, paddings props of contentContainerStyle, ...) is not working
2. When changing tabView's routes right in a screen or component, you should adding `animationEnabled={false}` to tabView props, otherwise there will be some bugs about ui, gestures,...( react-native-tab-view issue)

> [Refer to the official documentation](https://github.com/software-mansion/react-native-reanimated).
> I'm sure it won't be difficult for you

_Thank you for your effort._
