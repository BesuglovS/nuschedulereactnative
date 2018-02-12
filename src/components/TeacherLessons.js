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
    Picker, FlatList,
} from 'react-native';
import Storage from '../core/Storage'
import moment from 'moment'
import 'moment/locale/ru';

export default class TeacherLessons extends Component<{}> {
    static navigationOptions = {
        drawerLabel: 'Занятия преподавателя',
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
            teacherLessons:[]
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

        this.setState({teacherId: teacherId})

        let tId = (teacherId !== undefined) ? teacherId : this.state.teacherId;
        if (tId === "" || tId == null) return
        //http://wiki.nayanova.edu/api.php?action=teacherLessons&teacherId=1
        let teacherLessonsUrl =
            'http://wiki.nayanova.edu/api.php?action=teacherLessons&teacherId=' +
            tId;
        fetch(teacherLessonsUrl)
            .then((data) => data.json())
            .then((json) => {
                json.forEach((lesson, index, list) => {
                    let bigM = moment(lesson.Date + " " + lesson.Time.substring(0, 5), "YYYY-MM-DD HH:mm")
                    list[index].lessonIsBeforeNow = bigM.isBefore(moment())

                    let m = moment(lesson.Date, "YYYY-MM-DD")
                    list[index].Date = m.locale('ru').format('DD.MM.YYYY')
                    list[index].Time = list[index].Time.substring(0, 5);
                });

                console.log(json);


                this.setState({
                    teacherLessons: json
                })
            })
            .catch(function(error) {
                console.log(error)
            });
    }

    renderItem = ({item, index}) => {
        return (
            <View style={{ flex: 1, alignSelf: 'stretch', flexDirection: 'row' }}
                  key={index}
            >
                <View style={[styles.tableCell, {flex: 2}]}>
                    <Text style={styles.tableCellText}>{item.disciplineName}</Text>
                </View>
                <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>{item.studentGroupname}</Text>
                </View>
                <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>{item.Date}</Text>
                </View>
                <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>{item.Time}</Text>
                </View>
                <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>{item.auditoriumName}</Text>
                </View>
            </View>
        )
    };

    keyExtractor = (item, index) => index;

    render() {
        const { navigate } = this.props.navigation;

        const teachersPickerItems = this.state.teachersList.map((val, ind) => {
            return (
                <Picker.Item value={val.TeacherId} label={val.FIO} key={ind} />
            )
        });

        const headerRow = (this.state.teacherLessons.length === 0) ? (
                <Text style={styles.dowName}>Занятий нет</Text>
            ) :
            (
                null
            )


        return (
            <View style={styles.container}>
                <Text style={styles.mainHeader}>Занятия преподавателя</Text>

                <Picker
                    selectedValue={this.state.teacherId}
                    onValueChange={(itemValue, itemIndex) => {
                        this.teacherChanged(itemValue)
                    }}>
                    {teachersPickerItems}
                </Picker>

                {headerRow}

                <FlatList
                    style={styles.list}
                    keyExtractor={this.keyExtractor}
                    data={this.state.teacherLessons}
                    renderItem={this.renderItem}
                />

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
        backgroundColor: '#0D6759',
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
