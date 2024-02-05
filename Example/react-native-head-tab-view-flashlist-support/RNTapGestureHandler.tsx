import {View, Text} from 'react-native';
import React from 'react';
import {TapGestureHandler} from 'react-native-gesture-handler';
const RNTapGestureHandler = ({children}) => {
  return (
    <TapGestureHandler cancelsTouchesInView={false}>
      <View>{children}</View>
    </TapGestureHandler>
  );
};

export default RNTapGestureHandler;
