import {useState, useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import Map from './components/Map';
import * as AWS from 'aws-sdk';
import Geocoder from 'react-native-geocoding';
import {dynamoCreds, mapsApiKey, socketUri} from './config';

AWS.config.update(dynamoCreds);

const params = {
  TableName: 'people',
};

const App = () => {
  const [markers, setMarkers] = useState([]);
  const mapRegion = {
    latitude: 23.0,
    longitude: 80.0,
    latitudeDelta: 23.0,
    longitudeDelta: 23.0,
  };

  const fetchDataset = async () => {
    const docClient = new AWS.DynamoDB.DocumentClient();
    let tmpMarkers = [];
    docClient.scan(params, async (err, data) => {
      if (!err) {
        for (item of data.Items) {
          const {name, zip} = item;
          const markerData = await getMarkerData({zip, name});
          tmpMarkers.push(markerData);
        }
        console.log(JSON.stringify(tmpMarkers, null, 2));
        setMarkers(tmpMarkers);
      }
    });
  };

  /* Fetch the values on load */
  useEffect(() => {
    fetchDataset();
  }, []);

  useEffect(() => {
    const socket = new WebSocket(socketUri);

    socket.onopen = () => console.log('connected');

    socket.onmessage = () => {
      fetchDataset();
    };

    return () => {
      socket.close();
    };
  }, []);

  const getMarkerData = async ({zip, name}) => {
    try {
      Geocoder.init(mapsApiKey);
      const json = await Geocoder.from(`${zip}`);
      const location = json.results[0].geometry.location;
      const {lat, lng} = location;
      return {
        latitude: lat,
        longitude: lng,
        title: name,
        image: 'https://picsum.photos/100',
      };
    } catch (error) {
      console.warn(error);
    }
  };

  return (
    <View style={styles.container}>
      <Map mapRegion={mapRegion} markers={markers} />
    </View>
  );
};
export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
