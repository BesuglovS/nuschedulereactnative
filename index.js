import React, {Component} from 'react';
import {
    AppRegistry,
    ScrollView,
    SafeAreaView,
    StyleSheet,
    Text,
    Image,
    View,
} from 'react-native';
import {DrawerItems, DrawerNavigator} from 'react-navigation';
import GroupDisciplines from './src/components/GroupDisciplines';
import GroupWeekSchedule from './src/components/GroupWeekSchedule';
import TeacherDisciplines from "./src/components/TeacherDisciplines";
import TeacherSchedule from "./src/components/TeacherSchedule";
import GroupDaySchedule from "./src/components/GroupDaySchedule";
import LastLesson from "./src/components/LastLesson";
import DisciplineLessons from "./src/components/DisciplineLessons";
import GroupSession from "./src/components/GroupSession";
import TeacherSession from "./src/components/TeacherSession";
import Storage from './src/core/Storage'

const CustomDrawerContentComponent = (props) => (
    <ScrollView>
        <SafeAreaView style={styles.container} forceInset={{ top: 'always', horizontal: 'never' }}>
            <View style={styles.menuHeaderTopRow}>
                <Image source={require('./src/assets/logo128.jpg')} style={styles.menuLogo}  />
                <Text style={styles.menuHeader}>Расписание СГОАН</Text>
            </View>
            <DrawerItems {...props} />
        </SafeAreaView>
    </ScrollView>
);

const DrawerNavigatorConfig = {
    drawerOpenRoute: 'DrawerOpen',
    drawerCloseRoute: 'DrawerClose',
    drawerToggleRoute: 'DrawerToggle',
    contentComponent : CustomDrawerContentComponent
}

const nuschedulereactnative = (DrawerNavigator({
        GroupWeekSchedule: {screen: GroupWeekSchedule},
        GroupDaySchedule: {screen: GroupDaySchedule},
        TeacherSchedule: {screen: TeacherSchedule},
        GroupSession: {screen: GroupSession},
        TeacherSession: {screen: TeacherSession},
        GroupDisciplines: {screen: GroupDisciplines},
        TeacherDisciplines: {screen: TeacherDisciplines},
        LastLesson: {screen: LastLesson},
        DisciplineLessons: {screen: DisciplineLessons},
    },
    DrawerNavigatorConfig))

const styles = StyleSheet.create({
    menuHeaderTopRow: {
        flexDirection: 'row',
        margin: 5,
        padding: 5,
        alignItems: 'center'
    },
    container: {
        flex: 1,
    },
    menuHeader: {
        margin: 5,
        padding: 5,
    },
    menuLogo: {
        height: 32,
        width: 32
    }
});

AppRegistry.registerComponent('nuschedulereactnative', () => nuschedulereactnative);
