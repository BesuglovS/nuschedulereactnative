/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
    Picker,
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableHighlight,
    InteractionManager,
    Dimensions,
    TextInput,
    DatePickerAndroid,
} from 'react-native';
import Utilities from "../core/Utilities";
import moment from 'moment'
import 'moment/locale/ru';
import Storage from '../core/Storage'


export default class GroupDaySchedule extends Component<{}> {

    static navigationOptions = {
        drawerLabel: 'Расписание группы на день',
        // drawerIcon: ({ tintColor }) => (
        //     <Image
        //         source={require('./chats-icon.png')}
        //         style={[styles.icon, {tintColor: tintColor}]}
        //     />
        // ),
    };

    constructor(props) {
        super(props);

        this.state = {
            groupId: -1,
            groupsList:[],
            scheduleDate: moment().format("DD MMMM YYYY"),
            groupSchedule:[],
        }

        this.groupChanged = this.groupChanged.bind(this)
        this.datePickerOnFocus = this.datePickerOnFocus.bind(this)
    }

    componentDidMount() {
        let mainGroupsAPIUrl = 'http://wiki.nayanova.edu/api.php?action=list&listtype=mainStudentGroups';
        fetch(mainGroupsAPIUrl)
            .then((data) => data.json())
            .then((json) => {
                this.setState({
                    groupsList: json
                })

                Storage.FetchData("groupName", (err, data) => {
                    if (err === null && data !== null) {
                        let groups = this.state.groupsList.filter(g => g.Name === data)

                        if (groups.length > 0) {
                            this.groupChanged(groups[0].StudentGroupId)
                        }
                    } else {
                        if (json.length > 0) {
                            this.groupChanged(json[0].StudentGroupId)
                        }
                    }
                })
            })
            .catch(function(error) {
                console.log(error)
            });
    }

    updateSchedule(groupId, date) {
        let studentGroupId = (groupId !== undefined) ? groupId : this.state.groupId;
        let scheduleDate = (date !== undefined) ? date : this.state.scheduleDate;
        if (studentGroupId === "") return
        //http://wiki.nayanova.edu/api.php?action=dailySchedule&groupId=84&date=2017-11-29
        let dailyScheduleAPIUrl = 'http://wiki.nayanova.edu/api.php?action=dailySchedule' +
            '&groupId=' + studentGroupId +
            '&date=' + this.reformatDate(scheduleDate);
        fetch(dailyScheduleAPIUrl)
            .then((data) => data.json())
            .then((json) => {
                if (json === "Занятий нет")
                {
                    json = []
                }

                this.setState({
                    groupSchedule: json
                })
            })
            .catch(function(error) {
                console.log(error)
            });
    }

    groupChanged(groupId) {
        let groups = this.state.groupsList.filter(g => g.StudentGroupId === groupId)
        if (groups.length > 0) {
            Storage.SaveData("groupName", groups[0].Name)
        }

        this.setState({
            groupId
        })
        this.updateSchedule(groupId, this.state.week)
    }

    async datePickerOnFocus() {
        try {
            let initialDate = new Date();
            if (this.state.scheduleDate !== "") {
                let momentDate = moment(this.state.scheduleDate, "DD MMMM YYYY")
                initialDate = momentDate.toDate()
            }

            const {action, year, month, day} = await DatePickerAndroid.open({
                date: initialDate
            });
            if (action !== DatePickerAndroid.dismissedAction) {
                let dt = moment(year + "-" + (month+1) + "-" + day, "YYYY-MM-DD")
                this.dateChanged(dt)
            }
        } catch ({code, message}) {
            console.warn('Cannot open date picker', message);
        }
    }

    render() {
        const { navigate } = this.props.navigation;

        let firstTime = true
        let timeString = ""

        const scheduleItems = this.state.groupSchedule.map((lesson, index) => {
            let timeStr = ""
            if (lesson.Time !== timeString) {
                firstTime = true
                timeStr = lesson.Time
            } else {
                firstTime = false
                timeStr = ""
            }

            timeString = timeStr

            let groupName = ""
            let groups = this.state.groupsList.filter(g => g.StudentGroupId === this.state.groupId)
            if (groups.length > 0) {
                groupName = groups[0].Name
            }

            let groupString = ""
            let lessonGroupName = lesson.groupName
            if (lessonGroupName !== groupName) {
                groupString = " (" + lessonGroupName + ")"
            }

            return (
                <View style={styles.lessonContainer} key={index}>
                    <Text style={styles.timeStr}>{timeStr}</Text>
                    <View style={styles.mainSchedule}>
                        <Text style={styles.mainScheduleDiscName}>{lesson.discName}{groupString}</Text>
                        <Text style={styles.mainScheduleTeacherFIO}>{lesson.FIO}</Text>
                    </View>
                    <Text  style={styles.aud}>{lesson.audName}</Text>
                </View>
            )
        })


        const groupsPickerItems = this.state.groupsList.map((val, ind) => {
            return (
                <Picker.Item value={val.StudentGroupId} label={val.Name} key={ind} />
            )
        });


        let scheduleItemsWrapper = (this.state.groupSchedule.length === 0) ?
                (<Text style={styles.dowName}>Занятий нет</Text>) :
                ([scheduleItems])

        return (
            <View style={styles.container}>
                <View style={styles.pickerContainer}>
                    <Picker
                        propmpt={"Выберите группу"}
                        selectedValue={this.state.groupId}
                        onValueChange={(itemValue) => {
                            this.groupChanged(itemValue)
                        }}>
                        {groupsPickerItems}
                    </Picker>
                </View>
                <View style={styles.dateContainerView}>
                    <TouchableHighlight
                        underlayColor="#009688"
                        onPress={this.datePickerOnFocus} >
                        <Text style={styles.dateInput}>
                            {this.state.scheduleDate}
                        </Text>
                    </TouchableHighlight>
                </View>
                <View style={styles.scheduleContainer}>
                    <ScrollView>
                        {scheduleItemsWrapper}
                    </ScrollView>
                </View>
            </View>
        );
    }

    reformatDate(scheduleDate) {
        //http://wiki.nayanova.edu/api.php?action=dailySchedule&groupId=84&date=2017-11-29
        return moment(scheduleDate, "DD MMMM YYYY").format("YYYY-MM-DD")
    }

    dateChanged(date) {
        let dt = date.locale('ru').format("DD MMMM YYYY")
        this.setState({
            scheduleDate: dt
        })

        this.updateSchedule(this.state.groupId, dt)
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#49708A',
        flex: 1,
        flexDirection: 'column',
    },
    pickerContainer: {
        paddingLeft: 20,
        paddingRight: 20,
    },
    dateContainerView: {
        height: 70,
        alignItems: 'center',
        justifyContent: 'center',
        //backgroundColor: 'white',
        marginTop: 10,
        marginBottom: 10,
    },
    scheduleContainer: {
        flexDirection: 'column',
        flex: 1,
        backgroundColor: '#EDE7BE',
    },
    lessonContainer: {
        flexDirection: 'row',
        paddingLeft: 10,
        paddingRight: 10,
    },
    timeStr: {
        flex: 1,
        textAlignVertical: 'center',
    },
    mainSchedule: {
        flex: 4,
        justifyContent: 'center',
    },
    mainScheduleDiscName: {

    },
    mainScheduleTeacherFIO: {

    },
    mainScheduleWeeks: {

    },
    aud: {
        flex: 1,
        textAlignVertical: 'center',
        fontSize: 12,
        textAlign: 'center',
    },
    dowName: {
        backgroundColor: '#E7A97E',
        textAlign: 'center',
        fontSize: 18
    },
    dateInput: {
        height: 70,
        width: 250,
        fontSize: 20,
        borderColor: '#EDE7BE',
        borderWidth: 1,
        textAlign: 'center',
        textAlignVertical: 'center',
    }
});
