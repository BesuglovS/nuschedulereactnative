/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Picker,
    ScrollView,
} from 'react-native';
import Storage from '../core/Storage'
import moment from 'moment'
import 'moment/locale/ru';

export default class DisciplineLessons extends Component<{}> {
    static navigationOptions = {
        drawerLabel: 'Список занятий по дисциплине',
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
            teacherId: '',
            teachersList:[],
            tfdId: '',
            tfdList:[],
            lessonsList:[],
            hoursByLesson: -1,
            lessonsByMonth: {}
        }
    }

    componentDidMount() {
        let teachersListAPIUrl = 'http://wiki.nayanova.edu/api.php?action=list&listtype=teachers';
        fetch(teachersListAPIUrl)
            .then((data) => data.json())
            .then((json) => {
                this.setState({
                    teachersList: json
                })

                Storage.FetchData("teacherFIO", (err, data) => {
                    if (err === null && data !== null) {
                        let teachers = this.state.teachersList.filter(t => t.FIO === data)
                        if (teachers.length > 0) {
                            this.teacherChanged(teachers[0].TeacherId)
                        }
                    } else {
                        if (json.length > 0) {
                            this.teacherChanged(json[0].TeacherId)
                        }
                    }
                })

            })
            .catch(function(error) {
                console.log(error)
            });


    }

    teacherChanged(teacherId) {
        let teachers = this.state.teachersList.filter(t => t.TeacherId === teacherId)
        if (teachers.length > 0) {
            Storage.SaveData("teacherFIO", teachers[0].FIO)
        }

        this.setState({
            teacherId: teacherId,
            lessonsList: [],
            lessonsByMonth: {}
        })

        this.updateDisciplinesList(teacherId)
    }

    selectedTfdChanged (tfdId) {
        let tfdItem = this.state.tfdList.filter(tfd => tfd.TeacherForDisciplineId === tfdId)[0];

        this.setState({
            tfdId
        })

        this.updateLessonsList(tfdId, tfdItem["hoursByLesson"])
    }

    updateDisciplinesList(teacherId) {
        let tfdListAPIUrl = 'http://wiki.nayanova.edu/api.php?action=list&listtype=tfdListExpanded' +
            '&teacherId=' + teacherId;

        fetch(tfdListAPIUrl)
            .then((data) => data.json())
            .then((json) => {
                json.forEach(item => {
                    if (
                        item["studentGroupName"].startsWith("1 ") ||
                        item["studentGroupName"].startsWith("2 ") ||
                        item["studentGroupName"].startsWith("3 ") ||
                        item["studentGroupName"].startsWith("4 ") ||
                        item["studentGroupName"].startsWith("5 ") ||
                        item["studentGroupName"].startsWith("6 ") ||
                        item["studentGroupName"].startsWith("7 "))
                    {
                        item["hoursByLesson"] = 1
                    } else {
                        item["hoursByLesson"] = 2
                    }

                    item["summary"] =
                        item["studentGroupName"] + " " +
                        item["disciplineName"]
                })

                this.setState({
                    tfdList: json
                })

                if (json.length > 0) {
                    this.selectedTfdChanged(json[0].TeacherForDisciplineId)
                }

            })
            .catch(function(error) {
                console.log(error)
            });
    }


    updateLessonsList(tfdId, hoursByLesson) {
        let tId = (tfdId !== undefined) ? tfdId : this.state.tfdId;
        if (tId === "" || tId == null) return
        //http://wiki.nayanova.edu/api.php?action=disciplineLessons&tfdId=1
        let teacherScheduleUrl =
            'http://wiki.nayanova.edu/api.php?action=disciplineLessons&tfdId=' +
            tId;

        fetch(teacherScheduleUrl)
            .then((data) => data.json())
            .then((json) => {
                json.sort((a,b) => {
                    let aMoment = moment(a.Date + " " + a.Time.substr(0,5))
                    let bMoment = moment(b.Date + " " + b.Time.substr(0,5))

                    if (aMoment.isBefore(bMoment)) return -1
                    if (bMoment.isBefore(aMoment)) return 1
                    return 0
                })

                let lessonsByMonth = {}

                json.forEach(item => {
                    item.Moment = moment(item.Date + " " + item.Time)
                    item.Time = item.Time.substr(0,5)
                    let momentDate = moment(item.Date)
                    item.Date = momentDate.locale('ru').format('DD MMMM')
                    let month = momentDate.month()

                    if (!lessonsByMonth.hasOwnProperty(month)) {
                        lessonsByMonth[month] = hoursByLesson
                    } else {
                        lessonsByMonth[month] += hoursByLesson
                    }
                })

                this.setState({
                    lessonsList: json,
                    lessonsByMonth
                })
            })
            .catch(function(error) {
                console.log(error)
            });
    }



    render() {
        const { navigate } = this.props.navigation;

        const teachersPickerItems = this.state.teachersList.map((val, ind) => {
            return (
                <Picker.Item value={val.TeacherId} label={val.FIO} key={ind} />
            )
        });

        const tfdPickerItems = this.state.tfdList.map((val, ind) => {
            return (
                <Picker.Item value={val.TeacherForDisciplineId} label={val.summary} key={ind} />
            )
        });

        let months = Object.keys(this.state.lessonsByMonth).sort((a,b) => {return a-b})
        const hoursTableItems = months.map((month, index) => {
            return (
                <View style={{ height: 50, alignSelf: 'stretch', flexDirection: 'row' }}
                      key={index}
                >
                    <View style={[styles.tableCell]}>
                        <Text style={styles.tableCellText}>
                            {moment([2000,1,1]).month(month).locale('ru').format('MMMM')}
                        </Text>
                    </View>
                    <View style={styles.tableCell}>
                        <Text style={styles.tableCellText}>
                            {this.state.lessonsByMonth[month]}
                        </Text>
                    </View>
                </View>
            )
        })

        const lessonsListItems = this.state.lessonsList.map((lesson, index) => {
            return (
                <View style={{ height: 50, alignSelf: 'stretch', flexDirection: 'row' }}
                      key={index}
                >
                    <View style={[styles.tableCell]}>
                        <Text style={styles.tableCellText}>
                            {lesson.Date}
                        </Text>
                    </View>
                    <View style={[styles.tableCell]}>
                        <Text style={styles.tableCellText}>
                            {lesson.Time}
                        </Text>
                    </View>
                    <View style={[styles.tableCell]}>
                        <Text style={styles.tableCellText}>
                            {lesson.Name}
                        </Text>
                    </View>
                </View>
            )
        })

        const hoursTableWrapper = (this.state.lessonsByMonth.length === 0) ? (
                <Text style={styles.dowName}>Занятий нет</Text>
            ) :
            (
                [hoursTableItems]
            )

        const lessonsListWrapper = (this.state.lessonsList.length === 0) ? null :
            (
                [lessonsListItems]
            )


        return (
            <View style={styles.container}>
                <Text style={styles.mainHeader}>Список занятий по дисциплине</Text>

                <Picker
                    selectedValue={this.state.teacherId}
                    onValueChange={(itemValue, itemIndex) => {
                        this.teacherChanged(itemValue)
                    }}>
                    {teachersPickerItems}
                </Picker>

                <Picker
                    selectedValue={this.state.tfdId}
                    onValueChange={(itemValue, itemIndex) => {
                        this.selectedTfdChanged(itemValue)
                    }}>
                    {tfdPickerItems}
                </Picker>

                <ScrollView>
                    {hoursTableWrapper}
                    {lessonsListWrapper}
                </ScrollView>

            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FCFF',
    },
    mainHeader: {
        fontSize: 20,
        backgroundColor: '#1B676B',
        color: 'white',
        width: '100%',
        textAlign: 'center',
        padding: 10,
    },
    list: {
        marginLeft: 5,
        marginRight: 5,
    },
    tableCell: {
        flex: 1,
        alignSelf: 'stretch',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#1B676B',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 0,
        padding: 3,
    },
    tableCellText: {
        fontSize: 7,
        textAlign: 'center'
    },
    dowName: {
        backgroundColor: '#E7A97E',
        textAlign: 'center',
        fontSize: 18
    },
});
