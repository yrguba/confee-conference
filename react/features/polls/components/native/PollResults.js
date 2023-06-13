// @flow

import React, { useCallback } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useSelector } from 'react-redux';

import { getLocalParticipant } from '../../../base/participants';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import AbstractPollResults from '../AbstractPollResults';
import type { AbstractProps, AnswerInfo } from '../AbstractPollResults';

import { chatStyles, dialogStyles, resultsStyles } from './styles';


/**
 * Component that renders the poll results.
 *
 * @param {Props} props - The passed props.
 * @returns {React.Node}
 */
const PollResults = (props: AbstractProps) => {
    const {
        answers,
        changeVote,
        haveVoted,
        question,
        showDetails,
        t,
        toggleIsDetailed
    } = props;

    /**
     * Render a header summing up answer information.
     *
     * @param {string} answer - The name of the answer.
     * @param {number} percentage - The percentage of voters.
     * @param {number} nbVotes - The number of collected votes.
     * @returns {React.Node}
     */
    const renderHeader = (answer: string, percentage: number, nbVotes: number) => (
        <View style = { resultsStyles.answerHeader }>
            <Text style = { resultsStyles.answer }>{ answer }</Text>
            <View>
                <Text style = { resultsStyles.answer }>({nbVotes}) {percentage}%</Text>
            </View>
        </View>
    );

    /**
     * Render voters of and answer.
     *
     * @param {AnswerInfo} answer - The answer info.
     * @returns {React.Node}
     */
    const renderRow = useCallback((answer: AnswerInfo) => {
        const { name, percentage, voters, voterCount } = answer;

        if (showDetails) {
            return (
                <View style = { resultsStyles.answerContainer }>
                    { renderHeader(name, percentage, voterCount) }
                    <View style = { resultsStyles.barContainer }>
                        <View style = { [ resultsStyles.bar, { width: `${percentage}%` } ] } />
                    </View>
                    { voters && voterCount > 0
                    && <View style = { resultsStyles.voters }>
                        {voters.map(({ id, name: voterName }) =>
                            (<Text
                                key = { id }
                                style = { resultsStyles.voter }>
                                { voterName }
                            </Text>)
                        )}
                    </View>}
                </View>
            );
        }


        // else, we display a simple list
        // We add a progress bar by creating an empty view of width equal to percentage.
        return (
            <View style = { resultsStyles.answerContainer }>
                { renderHeader(answer.name, percentage, voterCount) }
                <View style = { resultsStyles.barContainer }>
                    <View style = { [ resultsStyles.bar, { width: `${percentage}%` } ] } />
                </View>
            </View>
        );

    }, [ showDetails ]);
    const localParticipant = useSelector(getLocalParticipant);


    /* eslint-disable react/jsx-no-bind */
    return (
        <View>
            <Text style = { dialogStyles.questionText } >{ question }</Text>
            <Text style = { dialogStyles.questionOwnerText } >{ t('polls.by', { name: localParticipant.name }) }</Text>
            <FlatList
                data = { answers }
                keyExtractor = { (item, index) => index.toString() }
                renderItem = { answer => renderRow(answer.item) } />
            <View style = { chatStyles.bottomLinks }>
                <Button
                    labelKey = {
                        showDetails
                            ? 'polls.results.hideDetailedResults'
                            : 'polls.results.showDetailedResults'
                    }
                    labelStyle = { chatStyles.toggleText }
                    onClick = { toggleIsDetailed }
                    type = { BUTTON_TYPES.TERTIARY } />
                <Button
                    labelKey = {
                        haveVoted
                            ? 'polls.results.changeVote'
                            : 'polls.results.vote'
                    }
                    labelStyle = { chatStyles.toggleText }
                    onClick = { changeVote }
                    type = { BUTTON_TYPES.TERTIARY } />
            </View>
        </View>
    );
};

/*
 * We apply AbstractPollResults to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollResults(PollResults);
