import React, { ReactChildren } from 'react';
import { WithTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { translate } from '../../../base/i18n/functions';

// @ts-ignore
import styles from './styles';


/**
 * The type of the React {@code Component} props of {@link FormSection}.
 */
interface IProps extends WithTranslation {

    /**
     * The children to be displayed within this Link.
     */
    children: ReactChildren;

    /**
     * The i18n key of the text label of the section.
     */
    label: string;
}

/**
 * Section accordion on settings form.
 *
 * @returns {React$Element<any>}
 */
function FormSection({ children, label, t }: IProps) {
    return (
        <View>
            <View
                style = { styles.formSectionTitleContent }>
                <Text style = { styles.formSectionTitleText }>
                    { t(label) }
                </Text>
            </View>
            { children }
        </View>
    );
}

export default translate(FormSection);
