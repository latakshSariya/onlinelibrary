import React, { Component } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Button, TextInputComponent, TextInput, Image, KeyboardAvoidingView, ToastAndroid, AsyncStorage} from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import db from '../db ';
import * as firebase from 'firebase';

export default class issuescreen extends React.Component {
  constructor() {
    super();
    this.state = {
      Camerapermission: null,
      isScanned: false,
      ScannedData: '',
      buttonState: 'normal',
      scannedBookID:'',
      scannedStudentID:'',
      transation:'',
    }
  }

  getCameraPermission = async (id) => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({
      Camerapermission: status === 'granted',
      buttonState: id,
      isScanned: false
    })
  }

  barCodeScanHandler = async ({ type, data }) => {
    const {buttonState} = this.state
    if(buttonState === "bookid"){
      this.setState({
        isScanned: true,
        scannedBookID: data,
        buttonState: 'normal'
      })
    }else if(buttonState === "studentid"){
      this.setState({
        isScanned: true,
        scannedStudentID: data,
        buttonState: 'normal'
      })
    }
  }

  initiateBookIssue = async()=> {
    //Add your transation.
    db.collection("Transation").add({
      'studentId' : this.state.scannedStudentID,
      'bookId' : this.state.scannedBookID,
      'date' : firebase.firestore.Timestamp.now().toDate(),
      'transationType' : 'Issued'
    })
    //change Book Status
    db.collection("Students").doc(this.state.scannedStudentID).update({
      'BooksIssued' : firebase.firestore.FieldValue.increment(1)
    })
    db.collection("Book").doc(this.state.scannedBookID).update({
      'boookAvailability' : false
    })
    this.setState({
      scannedStudentID:'',
      scannedBookID:''
    })
  }

  initiatebookReturn=async()=>{
    db.collection("Transation").add({
      'studentId' : this.state.scannedStudentID,
      'bookId' : this.state.scannedBookID,
      'date' : firebase.firestore.Timestamp.now().toDate(),
      'transationType' : 'Returned'
    })
    //change Book Status
    db.collection("Students").doc(this.state.scannedStudentID).update({
      'BooksIssued' : firebase.firestore.FieldValue.increment(-1)
    })
    db.collection("Book").doc(this.state.scannedBookID).update({
      'boookAvailability' : true
    })
    this.setState({
      scannedStudentID:'',
      scannedBookID:''
    })
  }

  checkBookEligiblity = async()=>{
    const bookRef = await db.collection("Books").where("BookId", "==", this.state.scannedBookID).get()
    var bookEligiblity = ''

    if(bookRef.docs.length == 0){
      bookEligiblity = false;
    }else{
      bookRef.docs.map(doc=>{
        var book = doc.data();
        if(book.boookAvailability){
          bookEligiblity = "Issued";
        }else{
          bookEligiblity = "Returned";
        }
      })
    }
    return bookEligiblity
  }

  checkStudentEligiblityForBookIssue = async()=>{
    const studentRef = await db.collection("Students").where("StudentId", "==", this.state.scannedStudentID).get()
    var studentEligiblity = '';
    if(studentRef.docs.length == 0){
      this.setState({
        scannedBookID:'',
        scannedStudentID:''
      })
      studentEligiblity = false;
      alert("The student id does not exixt in the database")
    }else{
      studentRef.docs.map(doc=>{
        var student = doc.data()
        if(student.BooksIssued < 2){
          studentEligiblity = true;
        }
        else{
          studentEligiblity = false;
          alert("Please return the older books before issuing new book !");
          this.setState({
            scannedStudentID:'',
            scannedBookID:''
          })
        }
      })
    }
    return studentEligiblity;
  }

  checkStudentEligiblityForBookReturn = async()=>{
    const studentRef = await db.collection("Transation").where("bookId", "==", this.state.scannedBookID).limit(1).get()
    var studentEligiblity = '';
    studentRef.docs.map(doc=>{
      var books = doc.data();
      if(books.studentId === this.state.scannedStudentID){
        studentEligiblity = true;
      }else{
        studentEligiblity = false;
        alert("You didnt issued this book");
        this.setState({
          scannedBookID:'',
          scannedStudentID:''
        })
      }
    })
    return studentEligiblity;
  }

  handleTransation=async()=>{
    var TransationType = await this.checkBookEligiblity();
    if(!TransationType){
      alert("The book doesnt exist in the Library.")
      this.setState({
        scannedStudentID:'',
        scannedBookID:''
      })
    }else if(TransationType === 'Issued'){
      var studentEligiblity = await this.checkStudentEligiblityForBookIssue();
      if(studentEligiblity){
        this.initiateBookIssue()
        alert("Book issued to the student");
      }}else{
        var studentEligiblity = await this.checkStudentEligiblityForBookReturn();
        if(studentEligiblity){
          this.initiatebookReturn()
          alert("Book returned to the library");
        }
      }
    
  }


  render() {
    const CameraPermission = this.state.Camerapermission;
    const Scanned = this.state.isScanned;
    const buttonState = this.state.buttonState;

    if (buttonState !== 'normal' && CameraPermission) {
      return (
        <BarCodeScanner
          onBarCodeScanned={Scanned ? undefined : this.barCodeScanHandler}
          style={StyleSheet.absoluteFillObject}
        />
      )
    }

    else if (buttonState === 'normal') {
      return (
        <KeyboardAvoidingView style={{flex:1, justifyContent:'center', alignContent:'center'}} behavior = "padding" enabled>
          <View>
            <Image source={require('../assets/booklogo.jpg')}
              style={{ width: 300, height: 300, alignContent:'center', alignSelf:'center'  }} />
            <Text style={{ textAlign: 'center', fontSize: 50 }}>Library</Text>
          </View>
          <View>
            <TextInput
              style={styles.textinput}
              placeholder="Book ID Here"
              onChangeText={text => this.setState({
                scannedBookID : text
              })}
              value={this.state.scannedBookID} />
            <TouchableOpacity style={styles.button2} 
            onPress={()=>{
              this.getCameraPermission("bookid")
            }}
            ><Text style={styles.buttonTextStyle}>Scan ID</Text></TouchableOpacity>
          </View>
          <View>
            <TextInput
              style={styles.inputStyle}
              placeholder="Student ID Here"
              onChangeText={text => this.setState({
                scannedStudentID : text
              })}
              value={this.state.scannedStudentID}/>
            <TouchableOpacity style={styles.button}
            onPress={()=>{
              this.getCameraPermission("studentid")
            }}
            ><Text style={styles.buttonTextStyle}>Scan ID</Text></TouchableOpacity>
          </View>
          <TouchableOpacity onPress={async()=>{
            var transationmsg = this.handleTransation()
            this.setState({
              scannedBookID:'',
              scannedStudentID:''
            })
          }}><Text style={styles.submitstyle}>SUBMIT</Text></TouchableOpacity>
        </KeyboardAvoidingView>
      );
    }
  }
}


const styles = StyleSheet.create({
  headingStyle: {
    fontSize: 20,
    color: "black",
    alignContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 30
  }, buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8f4e1',
    alignSelf: 'center'
  },
  scanButton: {
    backgroundColor: '#4e3620',
    margin: 10,
    padding: 10,
    marginTop: 20
  },
  button: {
    backgroundColor: '#4e3620',
    marginLeft: 215,
    padding: 10,
    marginTop: -60,
    width: 100,
    height: 50,
    marginLeft:250
  },
  button2: {
    backgroundColor: '#4e3620',
    marginLeft: 215,
    padding: 10,
    marginTop: -60,
    width: 100,
    height: 50,
    marginLeft:250

  },
  buttonTextStyle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8f4e1',
    textAlign: 'center'
  },
  inputStyle: {
    margin: 10,
    padding: 10,
    borderWidth: 5,
    marginTop: 30,
    width: 200,
    height: 50,
    alignSelf:'center',
    marginRight:80

  },
  textinput: {
    margin: 10,
    padding: 10,
    borderWidth: 5,
    marginTop:50,
    width: 200,
    height: 50,
    alignSelf:'center',
    marginRight:80
  },
  submitstyle:{
    fontSize:15,
    alignSelf:'center',
    color:'#f8f4e1',
    backgroundColor: 'brown',
    margin:10,
    width: 120,
    height: 45,
    borderWidth:5,
    borderRadius:50,
    textAlign:'center',
    textAlignVertical:'center'

  }

})
