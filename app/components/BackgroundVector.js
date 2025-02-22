import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export const BackgroundVector = () => {
  return (
    <View style={{
      position: 'absolute',
      bottom: 0,
      width: '100%',
      height: 360,
    }}>
      <Svg width="100%" height="102%" viewBox="0 0 440 400">
        <Path
          d="M0 40 
             C100 0, 340 0, 440 40
             L440 400  
             L0 400  
             L0 40"
          fill="#042223"
        />
      </Svg>
    </View>
  );
};

export default BackgroundVector; 