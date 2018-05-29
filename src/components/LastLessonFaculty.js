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
    FlatList,
} from 'react-native';
import Storage from '../core/Storage'
import moment from 'moment'
import 'moment/locale/ru';

export default class LastLessonFaculty extends Component<{}> {
    static navigationOptions = {
        drawerLabel: 'Последний урок (по факультету)',
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
            facultyId: '',
            facultiesList:[],
            lastLessonsList:[]
        }
    }

    componentDidMount() {
        let facultyAPIUrl = 'http://wiki.nayanova.edu/api.php?action=list&listtype=faculties';
        fetch(facultyAPIUrl)
            .then((data) => data.json())
            .then((json) => {
                this.setState({
                    facultiesList: json
                })

                Storage.FetchData("facultyName", (err, data) => {
                    if (err === null && data !== null) {
                        let faculties = this.state.facultiesList.filter(g => g.Name === data)

                        if (faculties.length > 0) {
                            this.facultyChanged(faculties[0].FacultyId)
                        }
                    } else {
                        if (json.length > 0) {
                            this.facultyChanged(json[0].FacultyId)
                        }
                    }
                })
            })
            .catch(function(error) {
                console.log(error)
            });
    }

    facultyChanged(facultyId) {
        let faculties = this.state.facultiesList.filter(f => f.FacultyId === facultyId)
        if (faculties.length > 0) {
            Storage.SaveData("facultyName", faculties[0].Name)
        }

        this.setState({facultyId: facultyId})

        if (facultyId === "") return
        //http://wiki.nayanova.edu/api.php?action=LastLessons&groupId=15
        let lastLessonUrl =
            'http://wiki.nayanova.edu/api.php?action=LastLessons&facultyId=' + facultyId;
        fetch(lastLessonUrl)
            .then((data) => data.json())
            .then((json) => {
                this.setState({
                    lastLessonsList: json
                })
            })
            .catch(function(error) {
                console.log(error)
            });
    }

    reformatDate(date) {
        return moment(date, "YYYY-MM-DD").locale('ru').format("DD MMMM YYYY");
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
                <View style={[styles.tableCell, {flex: 1.5}]}>
                    <Text style={styles.tableCellText}>{item.Name}</Text>
                </View>
                <View style={[styles.tableCell, {flex: 0.75}]}>
                    <Text style={styles.tableCellText}>{item.GroupName}</Text>
                </View>
                <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>{this.reformatDate(item.lastLessonDate)}</Text>
                </View>
                <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>{item.teacherFIO}</Text>
                </View>
                <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>{Attestation[item.Attestation]}</Text>
                </View>
            </View>
        )
    };

    keyExtractor = (item, index) => index;

    render() {
        const { navigate } = this.props.navigation;

        const groupsPickerItems = this.state.facultiesList.map((val, ind) => {
            return (
                <Picker.Item value={val.FacultyId} label={val.Name} key={ind} />
            )
        });

        const headerRow = (this.state.lastLessonsList.length === 0) ? (
                <Text style={styles.dowName}>Дисциплин нет</Text>
            ) :
            (
                <View style={[{ alignSelf: 'stretch', flexDirection: 'row' }, styles.list]}>
                    <View style={[styles.tableCell, {flex: 1.5}]}>
                        <Text style={styles.tableCellText}>Дисциплина</Text>
                    </View>
                    <View style={[styles.tableCell, {flex: 0.75}]}>
                        <Text style={styles.tableCellText}>Группа</Text>
                    </View>
                    <View style={styles.tableCell}>
                        <Text style={styles.tableCellText}>Дата последнего урока</Text>
                    </View>
                    <View style={styles.tableCell}>
                        <Text style={styles.tableCellText}>ФИО преподавателя</Text>
                    </View>
                    <View style={styles.tableCell}>
                        <Text style={styles.tableCellText}>Форма отчётности</Text>
                    </View>
                </View>
            )


        return (
            <View style={styles.container}>
                <Text style={styles.mainHeader}>Последний урок</Text>

                <Picker
                    selectedValue={this.state.facultyId}
                    onValueChange={(itemValue) => {
                        this.facultyChanged(itemValue)
                    }}>
                    {groupsPickerItems}
                </Picker>

                {headerRow}

                <FlatList
                    style={styles.list}
                    keyExtractor={this.keyExtractor}
                    data={this.state.lastLessonsList}
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
        backgroundColor: '#5CACC4',
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
        borderColor: '#5CACC4',
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
