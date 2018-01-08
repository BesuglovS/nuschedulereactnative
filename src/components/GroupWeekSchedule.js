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
} from 'react-native';
import Utilities from "../core/Utilities";
import moment from 'moment'
import 'moment/locale/ru';
import Storage from '../core/Storage'


export default class GroupWeekSchedule extends Component<{}> {

    static navigationOptions = {
        drawerLabel: 'Расписание группы на неделю',
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
            week: 1,
            groupsList:[],
            groupSchedule:{},
            semesterStarts: null,
        }

        this.groupChanged = this.groupChanged.bind(this);
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

        let configOptionsUrl = 'http://wiki.nayanova.edu/api.php?action=list&listtype=configOptions';
        fetch(configOptionsUrl)
            .then((data) => data.json())
            .then((json) => {
                let ss = json.filter(i => i["Key"] === "Semester Starts")
                if (ss.length > 0) {
                    let semesterString = ss[0].Value;
                    let momentSemesterStarts = moment(semesterString, "YYYY-MM-DD")
                    momentSemesterStarts.startOf('isoweek')

                    this.setState({
                        semesterStarts: momentSemesterStarts
                    })

                    let momentNow = moment();
                    let days = momentNow.diff(momentSemesterStarts, 'days')

                    let weekNum = Math.floor(days / 7) + 1

                    if (weekNum < 1) weekNum = 1;
                    if (weekNum > 18) weekNum = 18;

                    this.onWeekChange(weekNum)
                }
            })
            .catch(function(error) {
                console.log(error)
            });


    }

    updateSchedule(gId, w) {
        let groupId = gId ? gId : this.state.groupId;
        let week = w ? w : this.state.week;
        this.setState({
            groupSchedule: {}
        })

        let weekSchedule =
            'http://wiki.nayanova.edu/api.php?action=weeksSchedule&groupId=' + groupId +
            '&weeks=' + week + "&compactResult";
        InteractionManager.runAfterInteractions(() => {
            fetch(weekSchedule)
                .then((data) => data.json())
                .then((json) => {
                    this.setState({
                        groupSchedule: json
                    })
                })
                .catch(function(error) {
                    console.log(error)
                });
        })
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

    onWeekChange(week) {
        this.setState({
            week
        });

        const screenWidth = Dimensions.get('window').width
        const itemWidth = 50

        this._scrollView.scrollTo(
            {
                x: ((week - 1) * itemWidth) - ((screenWidth - itemWidth)/ 2) ,
                y: 0,
                animated: true
            }
        )

        this.updateSchedule(this.state.groupId, week)
    }



    render() {
        const { navigate } = this.props.navigation;

        let dowList = Object.keys(this.state.groupSchedule).sort()

        let ruDOW = {
            1: "Понедельник",
            2: "Вторник",
            3: "Среда",
            4: "Четверг",
            5: "Пятница",
            6: "Суббота",
            7: "Воскресенье"
        }

        const WeekScheduleItems = dowList
            .map((dow, index) => {

                let dowMoment = null
                let dowString = ""
                let timeKeys = Object.keys(this.state.groupSchedule[dow])
                if (timeKeys.length !== 0) {
                    let timeSchedule = this.state.groupSchedule[dow][timeKeys[0]]
                    let tfdKeys = Object.keys(timeSchedule)
                    let date = timeSchedule[tfdKeys[0]]["lessons"][0]["date"];
                    dowMoment = moment(date, "YYYY-MM-DD");
                    dowString = dowMoment.locale('ru').format('DD MMMM YYYY')
                }

                if (this.state.groupSchedule[dow].length === 0) {
                    return null
                }

                let rings = Object.keys(this.state.groupSchedule[dow])
                    .sort((a, b) => {
                        let splitA = a.split(":")
                        let splitB = b.split(":")

                        let aSum = parseInt(splitA[0], 10) * 60 + parseInt(splitA[1], 10)
                        let bSum = parseInt(splitB[0], 10) * 60 + parseInt(splitB[1], 10)

                        return aSum - bSum
                    });

                const dowLessons = rings.map((time, index) => {

                    let tfdIds = Object.keys(this.state.groupSchedule[dow][time])

                    tfdIds.sort((tfdId1, tfdId2) => {
                        let auds1 = Object.keys(this.state.groupSchedule[dow][time][tfdId1]["weeksAndAuds"])
                        let weeks1 = []
                        auds1.forEach((a) => {
                            weeks1.push(...this.state.groupSchedule[dow][time][tfdId1]["weeksAndAuds"][a])
                        })
                        let minWeek1 = Math.min(...weeks1)

                        let auds2 = Object.keys(this.state.groupSchedule[dow][time][tfdId2]["weeksAndAuds"])
                        let weeks2 = []
                        auds2.forEach((a) => {
                            weeks2.push(...this.state.groupSchedule[dow][time][tfdId2]["weeksAndAuds"][a])
                        })
                        let minWeek2 = Math.min(...weeks2)

                        return minWeek1 - minWeek2
                    })

                    let firsttime = true

                    let tfdLessons = tfdIds.map((tfdId) => {
                        let auds = Object.keys(this.state.groupSchedule[dow][time][tfdId]["weeksAndAuds"])
                        let weeks = []
                        let audsStrings = []
                        auds.forEach((a) => {
                            weeks.push(...this.state.groupSchedule[dow][time][tfdId]["weeksAndAuds"][a])

                            let minWeek = Math.min(...this.state.groupSchedule[dow][time][tfdId]["weeksAndAuds"][a])
                            let obj = {}
                            obj[minWeek] = Utilities.GatherWeeksToString(
                                this.state.groupSchedule[dow][time][tfdId]["weeksAndAuds"][a])
                                + " - " + a
                            audsStrings.push(obj)
                        })

                        audsStrings.sort((a,b) => {
                            let aVal = Object.keys(a)[0]
                            let bVal = Object.keys(b)[0]

                            return aVal - bVal
                        })

                        audsStrings = audsStrings.map((obj) => {
                            let key = Object.keys(obj)[0]
                            return obj[key]
                        })


                        let audsString = ""
                        if (auds.length === 1) {
                            audsString = auds[0]
                        } else {
                            audsString = audsStrings.map((aud, index) => (<div key={index}>{aud}</div>))
                        }

                        let weeksString = "(" +
                            Utilities.GatherWeeksToString(weeks)
                            + ")"

                        let timeStr = firsttime ? time: ""

                        firsttime = false

                        return(
                            <View style={styles.lessonContainer} key={tfdId}>
                                <Text style={styles.timeStr}>{timeStr}</Text>
                                <View style={styles.mainSchedule}>
                                    <Text style={styles.mainScheduleDiscName}>{this.state.groupSchedule[dow][time][tfdId]["lessons"][0].discName}</Text>
                                    <Text style={styles.mainScheduleTeacherFIO}>{this.state.groupSchedule[dow][time][tfdId]["lessons"][0].teacherFIO}</Text>
                                    {/*<Text style={styles.mainScheduleWeeks}>{weeksString}</Text>*/}
                                </View>
                                <Text  style={styles.aud}>{audsString}</Text>
                            </View>
                        )
                    })

                    return (
                        [tfdLessons]
                    )
                })

                return (
                    <View key={index}>
                        <Text style={styles.dowName}>{ruDOW[dow]} ({dowString})</Text>
                        {dowLessons}
                    </View>
                )
            })

        const groupsPickerItems = this.state.groupsList.map((val, ind) => {
            return (
                <Picker.Item value={val.StudentGroupId} label={val.Name} key={ind} />
            )
        });

        let weeks = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]

        let weeksViews = weeks.map((week, index) => {
            let selectedStyle =  (week === this.state.week) ? styles.selectedWeekScheduleView : null;

            return (
                <TouchableHighlight
                    key={index}
                    style={[styles.weekScheduleView, selectedStyle]}
                    underlayColor={"#C8FA3B"}
                    onPress={() => {this.onWeekChange(week)}}
                >
                    <View>
                        <Text style={styles.weekNumbers}>{week}</Text>
                    </View>
                </TouchableHighlight>
            )
        })

        let emptySchedule = true;
        let loading = false;
        let dows = Object.keys(this.state.groupSchedule)
        if (dows.length === 0) {
            emptySchedule = false
            loading = true
        } else {
            dows.forEach((dow) => {
                if (Object.keys(this.state.groupSchedule[dow]).length !== 0) {
                    emptySchedule = false;
                }
            })
        }

        let scheduleItems = (loading) ?
            (null) :
            ((emptySchedule) ?
                (<Text style={styles.dowName}>Занятий нет</Text>) :
                ([WeekScheduleItems]))

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
                <View style={styles.weeksScrollView}>
                    <ScrollView ref={view => this._scrollView = view} horizontal={true}>
                        {weeksViews}
                    </ScrollView>
                </View>
                <View style={styles.scheduleContainer}>
                    <ScrollView>
                        {scheduleItems}
                    </ScrollView>
                </View>
            </View>
        );
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
    weeksScrollView: {
        height: 55,
        flexDirection: 'column',
        backgroundColor: '#49708A',
    },
    weekScheduleView: {
        width: 50,
        height: 50,
        backgroundColor: '#F1EFA5',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#49708A',
    },
    weekNumbers: {
        fontSize: 20,
    },
    selectedWeekScheduleView: {
        backgroundColor: "#DFBA69",
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
        fontSize: 12
    },
    dowName: {
        backgroundColor: '#E7A97E',
        textAlign: 'center',
        fontSize: 18
    },
});
