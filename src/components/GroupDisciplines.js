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

export default class GroupDisciplines extends Component<{}> {
    static navigationOptions = {
        drawerLabel: 'Дисциплины группы',
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
            groupDisciplines:[]
        }
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

    groupChanged(groupId) {
        let groups = this.state.groupsList.filter(g => g.StudentGroupId === groupId)
        if (groups.length > 0) {
            Storage.SaveData("groupName", groups[0].Name)
        }

        this.setState({groupId: groupId})

        let studentGroupId = (groupId !== undefined) ? groupId : this.state.groupId;
        if (studentGroupId === "") return
        //http://wiki.nayanova.edu/api.php?action=list&listtype=groupDisciplines&groupId=1
        let dailyScheduleAPIUrl =
            'http://wiki.nayanova.edu/api.php?action=list&listtype=groupDisciplines&groupId=' +
            studentGroupId;

        fetch(dailyScheduleAPIUrl)
            .then((data) => data.json())
            .then((json) => {
                let result = [];
                Object.keys(json).forEach(function(tfdId) {
                    let discipline = json[tfdId];
                    discipline['tfdId'] = tfdId;
                    result.push(discipline);
                });

                result = result.sort((a,b) => {
                    if (a.Name === b.Name) {
                        if (a.GroupName === b.GroupName) return 0;
                        return (a.GroupName < b.GroupName) ? -1 : 1;
                    }

                    return a.Name < b.Name ? -1 : 1;
                });

                this.setState({
                    groupDisciplines: result
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
                <View style={[styles.tableCell, {flex:1.5}]}>
                    <Text style={styles.tableCellText}>{Attestation[item.Attestation]}</Text>
                </View>
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

        const headerRow = (this.state.groupDisciplines.length === 0) ? (
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
                    <View style={[styles.tableCell, {flex:1.5}]}>
                        <Text style={styles.tableCellText}>Отчётность</Text>
                    </View>
                </View>
            )


        return (
            <View style={styles.container}>
                <Text style={styles.mainHeader}>Дисциплины группы</Text>

                <Picker
                    selectedValue={this.state.groupId}
                    onValueChange={(itemValue) => {
                        this.groupChanged(itemValue)
                    }}>
                    {groupsPickerItems}
                </Picker>

                {headerRow}

                <FlatList
                    style={styles.list}
                    keyExtractor={this.keyExtractor}
                    data={this.state.groupDisciplines}
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
