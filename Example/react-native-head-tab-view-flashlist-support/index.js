import {ScrollView, FlatList, SectionList} from 'react-native';
import createCollapsibleScrollView from './createCollapsibleScrollView';
import createCollapsibleFlashList from './createCollapsibleFlashList';
import createCollapsibleFlatList from './createCollapsibleFlatList';
export {HeaderContext} from './HeaderContext';
export {default as GestureContainer} from './GestureContainer';
import {FlashList} from '@shopify/flash-list';

const HScrollView = createCollapsibleScrollView(ScrollView);
const HFlatList = createCollapsibleFlatList(FlatList);
const HSectionList = createCollapsibleScrollView(SectionList);
const HFlashList = createCollapsibleFlashList(FlashList);
export {HScrollView, HFlatList, HSectionList, HFlashList};
