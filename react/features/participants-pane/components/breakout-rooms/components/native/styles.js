import BaseTheme from '../../../../../base/ui/components/BaseTheme';

const baseButton = {
    borderRadius: BaseTheme.shape.borderRadius,
    height: BaseTheme.spacing[7],
    marginTop: BaseTheme.spacing[3],
    marginLeft: BaseTheme.spacing[3],
    marginRight: BaseTheme.spacing[3]
};

/**
 * The styles of the native components of the feature {@code breakout rooms}.
 */
export default {

    button: {
        marginTop: BaseTheme.spacing[3],
        marginLeft: BaseTheme.spacing[3],
        marginRight: BaseTheme.spacing[3]
    },

    collapsibleRoom: {
        ...baseButton,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center'
    },

    collapsibleList: {
        alignItems: 'center',
        borderRadius: BaseTheme.shape.borderRadius,
        display: 'flex',
        flexDirection: 'row',
        height: BaseTheme.spacing[7],
        marginHorizontal: BaseTheme.spacing[3],
        marginTop: BaseTheme.spacing[3]
    },

    arrowIcon: {
        backgroundColor: BaseTheme.palette.ui03,
        height: BaseTheme.spacing[5],
        width: BaseTheme.spacing[5],
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },

    roomName: {
        fontSize: 15,
        color: BaseTheme.palette.text01,
        fontWeight: 'bold',
        marginLeft: BaseTheme.spacing[2]
    },

    listTile: {
        fontSize: 15,
        color: BaseTheme.palette.text01,
        fontWeight: 'bold',
        marginLeft: BaseTheme.spacing[2]
    },

    autoAssignLabel: {
        color: BaseTheme.palette.link01
    },

    autoAssignButton: {
        alignSelf: 'center',
        justifyContent: 'center',
        marginTop: BaseTheme.spacing[3]
    }
};
