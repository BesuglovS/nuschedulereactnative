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

export default class GroupSession extends Component<{}> {
    static navigationOptions = {
        drawerLabel: 'Экзамены группы',
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
            groupId: '',
            groupsList:[],
            groupExams:[],
            groupName: ""
        }
    }

    componentDidMount() {
        let mainGroupsAPIUrl = 'http://wiki.nayanova.edu/api.php?action=list&listtype=mainStudentGroups&sessionList';
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

    groupChanged(groupId) {
        let groups = this.state.groupsList.filter(g => g.StudentGroupId === groupId)
        if (groups.length > 0) {
            Storage.SaveData("groupName", groups[0].Name)
        }

        this.setState({groupId: groupId})

        let dailyScheduleAPIUrl =
            'http://wiki.nayanova.edu/api.php?action=groupExams' +
            '&groupId=' + groupId;
        fetch(dailyScheduleAPIUrl)
            .then((data) => data.json())
            .then((json) => {
                let exams = json[groupId].Exams

                exams.sort((a,b) => {
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

                exams.forEach((item) => {
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
                    item.mergeAud = (item.ConsultationAuditoriumName === item.ExamAuditoriumName)
                })

                this.setState({
                    groupExams: exams,
                    groupName: json[groupId].groupName
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
                item.ConsultationAuditoriumName.trim() === "") ? null :
                (
                    <View style={{ flex: 1, alignSelf: 'stretch', flexDirection: 'row' }}>
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
                            <Text style={styles.tableCellText}>{item.ConsultationAuditoriumName}</Text>
                        </View>
                    </View>
                )

        let examRow =
            (item.ExamDate.trim() === "" &&
                item.ExamTime.trim() === "" &&
                item.ExamAuditoriumName.trim() === "") ? null :
                (
                    <View style={{ flex: 1, alignSelf: 'stretch', flexDirection: 'row' }}>
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
                            <Text style={styles.tableCellText}>{item.ExamAuditoriumName}</Text>
                        </View>
                    </View>
                )

        return (
            <View key={index} style={{ flex: 1, alignSelf: 'stretch', flexDirection: 'column' }}>
                <View style={{ flex: 1, alignSelf: 'stretch', flexDirection: 'row' }}>
                    <View style={[styles.tableCell]}>
                        <Text style={styles.tableCellText}>{item.DisciplineName}</Text>
                    </View>
                    <View style={styles.tableCell}>
                        <Text style={styles.tableCellText}>{item.TeacherFIO}</Text>
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

        const groupsPickerItems = this.state.groupsList.map((val, ind) => {
            return (
                <Picker.Item value={val.StudentGroupId} label={val.Name} key={ind} />
            )
        });

        const examList = (this.state.groupExams.length === 0) ?
            (<Text style={styles.dowName}>Экзаменов нет</Text>) :
            (
                <FlatList
                    style={styles.list}
                    keyExtractor={this.keyExtractor}
                    data={this.state.groupExams}
                    renderItem={this.renderItem}
                />
            )

        return (
            <View style={styles.container}>
                <Text style={styles.mainHeader}>Экзамены группы</Text>

                <Picker
                    selectedValue={this.state.groupId}
                    onValueChange={(itemValue) => {
                        this.groupChanged(itemValue)
                    }}>
                    {groupsPickerItems}
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
        backgroundColor: '#8B911A',
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
