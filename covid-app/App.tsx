import React, { useState } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { StyleSheet, Text, View } from 'react-native';
import { Button, ButtonGroup, Icon, ListItem } from 'react-native-elements';


export default function App() {

  const [isRecording, setRecording] = useState(false);
  const [recordedTime, setRecordedTime] = useState(0);
  const [label, setLabel] = useState("UNKNOWN");
  const [currentAudio, setCurrentAudio] = useState({empty:true});
  const [list , setList]= useState({})
  const [isProcessing, setProcessing]= useState(false);

  const labels = ["Cough", "Unknown"];

  Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
    interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
    staysActiveInBackground: false,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: false,
    playThroughEarpieceAndroid: false
  })

  Audio.requestPermissionsAsync()

  const record = async () => {
    const recording = new Audio.Recording();
    setCurrentAudio({empty: true});
    try {
      try {
      const prepared = await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 1000,
        },
        ios: {
          ...Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY.ios,
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          sampleRate: 16000,
          bitRateStrategy:
            Audio.RECORDING_OPTION_IOS_BIT_RATE_STRATEGY_CONSTANT,
        },
      });
    } catch(ERR) {
      console.error(ERR)
    }


      await recording.startAsync();

      recording.setOnRecordingStatusUpdate(async (status) => {
        if (status.durationMillis >= (10000) && !status.isDoneRecording) {
          recording.stopAndUnloadAsync();
          const info = await FileSystem.getInfoAsync(recording.getURI());
          console.log(info)
          setProcessing(true);
          const base64Data = await FileSystem.readAsStringAsync(recording.getURI(), { encoding: "base64" });
          setCurrentAudio({...info, base64Data: base64Data, empty:false});
          setProcessing(false)
          setRecordedTime(0);
        } else {

          setRecordedTime(status.durationMillis / 1000);
        }

        setRecording(status.isRecording)
      })


      recording.setProgressUpdateInterval(500);


      // You are now recording!
    } catch (error) {
      // An error occurred!
      console.log(error)
    }

  }


  const handleLabels = (labelIdx) => { 
    const newLabel = labels[labelIdx]

    setLabel(newLabel);

    const keyLength = Object.keys(list).length
    list[keyLength] = { 
           "name": `${label} Sample ${keyLength}`, 
           "label": newLabel, 
           "info": currentAudio
         }
    setList(list);
  
  }
  const micIcon = <Icon name="ios-mic" type="ionicon" color="white" size={75} />

  return (
    <>
    <View style={styles.container}>
      <View style={styles.recorderView}>
        <Button buttonStyle={{ width: 100, height: 100, alignSelf: "center", borderRadius: 50 }} onPress={() => record()} icon={micIcon} />

        <View style={styles.recordingStatusView}>
            <Text>{!isRecording ? "Record a sample" : `Recording ${recordedTime} secs`}</Text>
          </View>

        <View style={styles.recorderView}>
          {!currentAudio.empty &&
            <ButtonGroup onPress={(idx) => handleLabels(idx)} disabled={isRecording} selectedIndex={label === "Cough" ? 0 : 1} buttons={labels} />
          }
        </View>
      </View>
      

    </View>
    <View style={styles.listView}>
    {
      Object.keys(list).map((key) => {
        const l = list[key];
        <ListItem
          //roundAvatar
          //avatar={{uri:l.avatar_url}}
          key={l.name}
          title={l.name}
        />
      })
    }
  </View></>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 2,
    backgroundColor: 'lightblue',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomColor: 'grey',
    borderBottomWidth: 2
  },
  recorderView: {
    padding: 50,
    paddingTop: 100,
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
  },
  recorderButtonView: {
    justifyContent: 'space-evenly',
  },
  recordingStatusView: {
    marginTop: 10
  },
  listView: {
    flex: 4,
    marginBottom: 5,

  }
});
