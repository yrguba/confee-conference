import React from 'react';

export interface INotificationProps {
    appearance?: string;
    concatText?: boolean;
    customActionHandler?: Function[];
    customActionNameKey?: string[];
    description?: string | React.ReactNode;
    descriptionArguments?: Object;
    descriptionKey?: string;
    hideErrorSupportLink?: boolean;
    icon?: string;
    maxLines?: number;
    sticky?: boolean;
    title?: string;
    titleArguments?: {
        [key: string]: string;
    };
    titleKey?: string;
    uid?: string;
}
