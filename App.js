import React, { Component } from 'react';
import { Text, View, StyleSheet, Button, Image } from 'react-native';
import { createAppContainer} from 'react-navigation'; 
import {createBottomTabNavigator} from 'react-navigation-tabs'
import explorescreen from './screens/explorescreen';
import issuescreen from './screens/issuescreen';

export default class App extends Component {
  render() {
    return (
      <View style={{flex:1}}>
        <AppContainer/>
      </View>
    )
  }
}
const navigator = createBottomTabNavigator({
  Transations : {screen:issuescreen},
  SearchBooks : {screen:explorescreen}
},
{
  defaultNavigationOptions:({navigation})=>({
    tabBarIcon:()=>{
      const route = navigation.state.routeName;
      if(route === "Transations"){
        return(
          <Image source={require('./assets/book.png')}
          style={{width:20, height:20}}/>
        )
      }else if(route === "SearchBooks"){
        return(
          <Image source={require('./assets/searchingbook.png')}
          style={{width:20, height:20}}/>
        )
      }  
    }
  })
}
)
const AppContainer = createAppContainer(navigator);