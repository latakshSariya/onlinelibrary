import React, { Component }from 'react';
import { Text, View, StyleSheet } from 'react-native';

export default class explorescreen extends React.Component {
  render() {
    return (
      <View style={{flex:1}}>

          <Text style = {styles.headingStyle}>Explore Books</Text>

      </View>
    )
  }
}

const styles = StyleSheet.create({
  headingStyle:{
      fontSize:10,
      color:"black",
      alignContent:'center',
      alignItems:'center'
  }
})
