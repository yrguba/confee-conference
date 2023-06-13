import { useHeaderHeight } from '@react-navigation/elements';
import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StyleType } from '../../styles';

type Props = {

    /**
     * Adds bottom padding.
     */
    addBottomPadding?: boolean,

    /**
     * The children component(s) of the Modal, to be rendered.
     */
    children: ReactElement,

    /**
     * Additional style to be appended to the KeyboardAvoidingView content container.
     */
    contentContainerStyle?: StyleType,

    /**
     * Disable forced keyboard dismiss?
     */
    disableForcedKeyboardDismiss?: boolean,

    /**
     * Is a text input rendered at the bottom of the screen?
     */
    hasBottomTextInput: boolean,

    /**
     * Is the screen rendering a tab navigator?
     */
    hasTabNavigator: boolean,

    /**
     * Additional style to be appended to the KeyboardAvoidingView.
     */
    style?: StyleType
}

const JitsiKeyboardAvoidingView = (
        {
            addBottomPadding = true,
            children,
            contentContainerStyle,
            disableForcedKeyboardDismiss,
            hasTabNavigator,
            hasBottomTextInput,
            style
        }: Props) => {
    const headerHeight = useHeaderHeight();
    const insets = useSafeAreaInsets();
    const [ bottomPadding, setBottomPadding ] = useState(insets.bottom);

    useEffect(() => {
        // This useEffect is needed because insets are undefined at first for some reason
        // https://github.com/th3rdwave/react-native-safe-area-context/issues/54
        setBottomPadding(insets.bottom);
    }, [ insets.bottom ]);


    const tabNavigatorPadding
        = hasTabNavigator ? headerHeight : 0;
    const extraBottomPadding
        = addBottomPadding ? bottomPadding : 0;
    const noNotchDevicePadding = extraBottomPadding || 10;
    const iosVerticalOffset
        = headerHeight + noNotchDevicePadding + tabNavigatorPadding;
    const androidVerticalOffset = hasBottomTextInput
        ? headerHeight + StatusBar.currentHeight : headerHeight;

    // Tells the view what to do with taps
    const shouldSetResponse = useCallback(() => !disableForcedKeyboardDismiss);
    const onRelease = useCallback(() => Keyboard.dismiss());

    return (
        <KeyboardAvoidingView
            behavior = { Platform.OS === 'ios' ? 'padding' : 'height' }
            contentContainerStyle = { contentContainerStyle }
            enabled = { true }
            keyboardVerticalOffset = {
                Platform.OS === 'ios'
                    ? iosVerticalOffset
                    : androidVerticalOffset
            }
            onResponderRelease = { onRelease }
            onStartShouldSetResponder = { shouldSetResponse }
            style = { style }>
            { children }
        </KeyboardAvoidingView>
    );
};


export default JitsiKeyboardAvoidingView;
