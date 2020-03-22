import React, { useState } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { StyleSheet, Text, View } from 'react-native';
import { Button, ButtonGroup, Icon, ListItem } from 'react-native-elements';

interface CurrentAudio {
  empty: boolean,
  idx?: string | number,
  info?: any,
  base64?: string
}

interface SampleListItem {
  name?: string,
  label?: string,
  info?: any,
  idx?: string
}

interface SampleListMap {
  [key: string]: SampleListItem,

}

export default function App() {

  const [isRecording, setRecording] = useState(false);
  const [recordedTime, setRecordedTime] = useState(0);
  const [label, setLabel] = useState(null as string);
  const [currentAudio, setCurrentAudio] = useState({ empty: true, } as CurrentAudio);
  const [list, setList] = useState({} as any)
  const [isProcessing, setProcessing] = useState(false);
  const [isPlaying, setPlaying] = useState(false);

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
    setCurrentAudio({ empty: true });
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
      } catch (ERR) {
        console.error(ERR)
      }


      await recording.startAsync();
      const keyLength = Object.keys(list).length
      const newListItem = {
        "idx": keyLength,
        "name": `Sample ${keyLength}`,
        "info": currentAudio,
        "label": "N/A",
        "status": "Recording"
      }
      const newList = list;
      newList[keyLength] = newListItem
      setList(newList);

      recording.setOnRecordingStatusUpdate(async (status) => {

        if (status.durationMillis >= (10000) && !status.isDoneRecording) {
          recording.stopAndUnloadAsync();


          const info = await FileSystem.getInfoAsync(recording.getURI());
          setProcessing(true);
          const base64Data = await FileSystem.readAsStringAsync(recording.getURI(), { encoding: "base64" });
          setCurrentAudio({ ...info, base64: base64Data, empty: false, idx: keyLength });
          setProcessing(false);
          setRecordedTime(0);

          const newList = list;
          newList[keyLength].info = info
          setList(newList);

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

  const playAudio = async (info?: FileSystem.FileInfo) => {
    console.log("IS PLAYING" + info.uri)
    if (info.exists) {
      const playbackObject = await Audio.Sound.createAsync(
        { uri: info.uri },
        { shouldPlay: true }
      );
      await playbackObject.sound.setVolumeAsync(0.8);

      playbackObject.sound.setOnPlaybackStatusUpdate(async (status) => {
        console.log(status);
        if (status.isLoaded) {
          
          //setPlaying(true)
          if (!status.isPlaying) {
            await playbackObject.sound.playAsync();
          }
          
          setPlaying(status.isPlaying)

          if (status.didJustFinish) { 

              await playbackObject.sound.unloadAsync();

          } else {
            
          }
        } 
      })



     

    }
  }


  const handleLabels = (labelIdx, key) => {
    const newLabel = labels[labelIdx]
    setLabel(newLabel);
    const newList = list;

    newList[key].label = newLabel;


    setList(newList)

  }
  const micIcon = <Icon name="ios-mic" type="ionicon" color="white" size={75} />
  const micOffIcon = <Icon name="ios-mic-off" type="ionicon" color="grey" size={75} />

  return (
    <>
      <View style={styles.container}>
        <View style={styles.recorderView}>
          <Button buttonStyle={{ width: 100, height: 100, alignSelf: "center", borderRadius: 50 }} onPress={() => record()} icon={isRecording ? micOffIcon : micIcon} disabled={isRecording} />

          <View style={styles.recordingStatusView}>
            <Text>{!currentAudio.empty ? "Record a sample" : `Recording ${recordedTime} secs`}</Text>
          </View>

          <View style={styles.recorderView}>
            
          </View>
        </View>

        <View style={styles.listView}>
          {/* <Text>{JSON.stringify(Object.keys(list))}</Text> */}
          {
            Object.keys(list).map((key) => {
              const l: SampleListItem = list[key];
              return <ListItem
                //roundAvatar
                //avatar={{uri:l.avatar_url}}
                key={l.idx}
                title={l.name}
                subtitle={l.label}
                onPress={() => playAudio(l.info)}
                buttonGroup={{onPress:(idx) => handleLabels(idx, key),  buttons: labels,}}
                disabled={isPlaying}
              />
            })
          }
        </View>

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
    width: 400

  }
});
