import {AsyncStorage} from 'react-native'

class Storage {

    static prefix: string = "@nuScheduleReactNative:";

    static async SaveData(Key, Value) {
        try {
            await AsyncStorage.setItem(this.prefix + Key, Value);
        } catch (error) {
            // Error saving data
        }
    }

    static async FetchData(Key, callback) {
        try {
            const value = await AsyncStorage.getItem(this.prefix + Key, callback);
            if (value !== null) {
                return value
            }
        } catch (error) {
            console.log(error)
        }
    }
}

export default Storage