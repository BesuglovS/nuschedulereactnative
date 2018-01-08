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

export default class TeacherSession extends Component<{}> {
    static navigationOptions = {
        drawerLabel: 'Экзамены преподавателя',
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
            teacherExams:[]
        }
    }

    componentDidMount() {
        let teachersListAPIUrl = 'http://wiki.nayanova.edu/api.php?action=list&listtype=teachers&sessionList';
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
        //http://wiki.nayanova.edu/api.php?action=teacherExams&teacherId=116
        let teacherScheduleUrl =
            'http://wiki.nayanova.edu/api.php?action=teacherExams' +
            '&teacherId=' + tId;
        fetch(teacherScheduleUrl)
            .then((data) => data.json())
            .then((json) => {
                json.sort((a,b) => {
                    let aMoment = (a["ConsultationDateTime"] === "") ?
                        moment(a["ExamDateTime"], "DD.MM.YYYY h:mm") :
                        moment(a["ConsultationDateTime"], "DD.MM.YYYY h:mm")
                    let bMoment = (b["ConsultationDateTime"] === "") ?
                        moment(b["ExamDateTime"], "DD.MM.YYYY h:mm") :
                        moment(b["ConsultationDateTime"], "DD.MM.YYYY h:mm")

                    if (aMoment.isBefore(bMoment)) return -1
                    if (bMoment.isBefore(aMoment)) return 1
                    return 0
                })

                json.forEach((item) => {
                    if (item.ConsultationDateTime.indexOf(" ") !== -1) {
                        let split = item.ConsultationDateTime.split(' ')
                        item.ConsultationDate = split[0]
                        item.ConsultationTime = split[1]
                        delete item.ConsultationDateTime;
                    } else {
                        item.ConsultationDate = item.ConsultationDateTime
                        item.ConsultationTime = ""
                        delete item.ConsultationDateTime;
                    }

                    if (item.ExamDateTime.indexOf(" ") !== -1) {
                        let split = item.ExamDateTime.split(' ')
                        item.ExamDate = split[0]
                        item.ExamTime = split[1]
                        delete item.ExamDateTime;
                    } else {
                        item.ExamDate = item.ExamDateTime
                        item.ExamTime = ""
                        delete item.ExamDateTime;
                    }

                    item.mergeTime = (item.ConsultationTime === item.ExamTime)
                    item.mergeAud = (item.consultationAud === item.examinationAud)
                })

                this.setState({
                    teacherExams: json
                })
            })
            .catch(function(error) {
                console.log(error)
            });
    }

    renderItem = ({item, index}) => {

        let consultationRow =
            (item.ConsultationDate.trim() === "" &&
             item.ConsultationTime.trim() === "" &&
             item.consultationAud.trim() === "") ? null :
        (
            <View style={{ flex: 1, alignSelf: 'stretch', flexDirection: 'row' }}
            >
                <View style={[styles.tableCell]}>
                    <Text style={styles.tableCellText}>Консультация</Text>
                </View>
                <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>{item.ConsultationDate}</Text>
                </View>
                <View style={[styles.tableCell]}>
                    <Text style={styles.tableCellText}>{item.ConsultationTime}</Text>
                </View>
                <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>{item.consultationAud}</Text>
                </View>
            </View>
        )

        let examRow =
            (item.ExamDate.trim() === "" &&
             item.ExamTime.trim() === "" &&
             item.examinationAud.trim() === "") ? null :
        (
            <View style={{ flex: 1, alignSelf: 'stretch', flexDirection: 'row' }}
            >
                <View style={[styles.tableCell]}>
                    <Text style={styles.tableCellText}>Экзамен</Text>
                </View>
                <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>{item.ExamDate}</Text>
                </View>
                <View style={[styles.tableCell]}>
                    <Text style={styles.tableCellText}>{item.ExamTime}</Text>
                </View>
                <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>{item.examinationAud}</Text>
                </View>
            </View>
        )

        return (
            <View key={index} style={{ flex: 1, alignSelf: 'stretch', flexDirection: 'column' }}>
                <View style={{ flex: 1, alignSelf: 'stretch', flexDirection: 'row' }}>
                    <View style={[styles.tableCell]}>
                        <Text style={styles.tableCellText}>{item.Name}</Text>
                    </View>
                    <View style={styles.tableCell}>
                        <Text style={styles.tableCellText}>{item.groupName}</Text>
                    </View>
                </View>
                {consultationRow}
                {examRow}
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

        const examList = (this.state.teacherExams.length === 0) ?
            (<Text style={styles.dowName}>Экзаменов нет</Text>) :
            (
                <FlatList
                    style={styles.list}
                    keyExtractor={this.keyExtractor}
                    data={this.state.teacherExams}
                    renderItem={this.renderItem}
                />
            )

        return (
            <View style={styles.container}>
                <Text style={styles.mainHeader}>Экзамены преподавателя</Text>

                <Picker
                    selectedValue={this.state.teacherId}
                    onValueChange={(itemValue, itemIndex) => {
                        this.teacherChanged(itemValue)
                    }}>
                    {teachersPickerItems}
                </Picker>

                {examList}
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
