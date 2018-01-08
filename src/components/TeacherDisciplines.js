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

export default class TeacherDisciplines extends Component<{}> {
    static navigationOptions = {
        drawerLabel: 'Дисциплины преподавателя',
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
            teacherDisciplines:[]
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
        //http://wiki.nayanova.edu/api.php?action=list&listtype=disciplines&teacherId=13
        let teacherScheduleUrl =
            'http://wiki.nayanova.edu/api.php?action=list&listtype=disciplines&teacherId=' +
            tId;
        fetch(teacherScheduleUrl)
            .then((data) => data.json())
            .then((json) => {
                this.setState({
                    teacherDisciplines: json
                })
            })
            .catch(function(error) {
                console.log(error)
            });
    }

    renderItem = ({item, index}) => {
        const Attestation = {
            0: "нет",
            1: "зачёт",
            2: "экзамен",
            3: "зачёт и экзамен",
            4: "зачёт с оценкой"
        }

        return (
            <View style={{ flex: 1, alignSelf: 'stretch', flexDirection: 'row' }}
                  key={index}
            >
                <View style={[styles.tableCell, {flex: 3}]}>
                    <Text style={styles.tableCellText}>{item.Name}</Text>
                </View>
                <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>{item.GroupName}</Text>
                </View>
                <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>{item.AuditoriumHours}</Text>
                </View>
                <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>{item.hoursCount}</Text>
                </View>
                <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>{item.LectureHours}</Text>
                </View>
                <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>{item.PracticalHours}</Text>
                </View>
                <View style={[styles.tableCell, {flex:1.5}]}>
                    <Text style={styles.tableCellText}>{Attestation[item.Attestation]}</Text>
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

        const headerRow = (this.state.teacherDisciplines.length === 0) ? (
                <Text style={styles.dowName}>Дисциплин нет</Text>
            ) :
            (
                <View style={[{ alignSelf: 'stretch', flexDirection: 'row' }, styles.list]}>
                    <View style={[styles.tableCell, {flex: 3}]}>
                        <Text style={styles.tableCellText}>Дисциплина</Text>
                    </View>
                    <View style={styles.tableCell}>
                        <Text style={styles.tableCellText}>Группа</Text>
                    </View>
                    <View style={styles.tableCell}>
                        <Text style={styles.tableCellText}>Часы</Text>
                    </View>
                    <View style={styles.tableCell}>
                        <Text style={styles.tableCellText}>В расписании</Text>
                    </View>
                    <View style={styles.tableCell}>
                        <Text style={styles.tableCellText}>Лекции</Text>
                    </View>
                    <View style={styles.tableCell}>
                        <Text style={styles.tableCellText}>Практики</Text>
                    </View>
                    <View style={[styles.tableCell, {flex:1.5}]}>
                        <Text style={styles.tableCellText}>Отчётность</Text>
                    </View>
                </View>
            )


        return (
            <View style={styles.container}>
                <Text style={styles.mainHeader}>Дисциплины преподавателя</Text>

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
                    data={this.state.teacherDisciplines}
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
