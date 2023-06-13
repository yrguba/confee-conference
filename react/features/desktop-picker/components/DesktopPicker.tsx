import Tabs from '@atlaskit/tabs';
import React, { PureComponent } from 'react';
import { WithTranslation } from 'react-i18next';

import { IStore } from '../../app/types';
import { hideDialog } from '../../base/dialog/actions';
import { translate } from '../../base/i18n/functions';
import { connect } from '../../base/redux/functions';
import Dialog from '../../base/ui/components/web/Dialog';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import { obtainDesktopSources } from '../functions';

// @ts-ignore
import DesktopPickerPane from './DesktopPickerPane';

/**
 * The size of the requested thumbnails.
 *
 * @type {Object}
 */
const THUMBNAIL_SIZE = {
    height: 300,
    width: 300
};

/**
 * The sources polling interval in ms.
 *
 * @type {int}
 */
const UPDATE_INTERVAL = 2000;

/**
 * The default selected tab.
 *
 * @type {string}
 */
const DEFAULT_TAB_TYPE = 'screen';

const TAB_LABELS = {
    screen: 'dialog.yourEntireScreen',
    window: 'dialog.applicationWindow'
};

const VALID_TYPES = Object.keys(TAB_LABELS);

/**
 * The type of the React {@code Component} props of {@link DesktopPicker}.
 */
interface IProps extends WithTranslation {

    /**
     * An array with desktop sharing sources to be displayed.
     */
    desktopSharingSources: Array<string>;

    /**
     * Used to request DesktopCapturerSources.
     */
    dispatch: IStore['dispatch'];

    /**
     * The callback to be invoked when the component is closed or when a
     * DesktopCapturerSource has been chosen.
     */
    onSourceChoose: Function;
}

/**
 * The type of the React {@code Component} state of {@link DesktopPicker}.
 */
interface IState {

    /**
     * The state of the audio screen share checkbox.
     */
    screenShareAudio: boolean;

    /**
     * The currently highlighted DesktopCapturerSource.
     */
    selectedSource: any;

    /**
     * The desktop source type currently being displayed.
     */
    selectedTab: number;

    /**
     * An object containing all the DesktopCapturerSources.
     */
    sources: Object;

    /**
     * The desktop source types to fetch previews for.
     */
    types: Array<string>;
}


/**
 * React component for DesktopPicker.
 *
 * @augments Component
 */
class DesktopPicker extends PureComponent<IProps, IState> {
    /**
     * Implements React's {@link Component#getDerivedStateFromProps()}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: IProps) {
        return {
            types: DesktopPicker._getValidTypes(props.desktopSharingSources)
        };
    }

    /**
     * Extracts only the valid types from the passed {@code types}.
     *
     * @param {Array<string>} types - The types to filter.
     * @private
     * @returns {Array<string>} The filtered types.
     */
    static _getValidTypes(types: string[] = []) {
        return types.filter(
            type => VALID_TYPES.includes(type));
    }

    _poller: any = null;

    state: IState = {
        screenShareAudio: false,
        selectedSource: {},
        selectedTab: 0,
        sources: {},
        types: []
    };

    /**
     * Stores the type of the selected tab.
     *
     * @type {string}
     */
    _selectedTabType = DEFAULT_TAB_TYPE;

    /**
     * Initializes a new DesktopPicker instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onCloseModal = this._onCloseModal.bind(this);
        this._onPreviewClick = this._onPreviewClick.bind(this);
        this._onShareAudioChecked = this._onShareAudioChecked.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._onTabSelected = this._onTabSelected.bind(this);
        this._updateSources = this._updateSources.bind(this);

        this.state.types
            = DesktopPicker._getValidTypes(this.props.desktopSharingSources);
    }

    /**
     * Starts polling.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this._startPolling();
    }

    /**
     * Clean up component and DesktopCapturerSource store state.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._stopPolling();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <Dialog
                ok = {{
                    disabled: Boolean(!this.state.selectedSource.id),
                    translationKey: 'dialog.Share'
                }}
                onCancel = { this._onCloseModal }
                onSubmit = { this._onSubmit }
                size = 'large'
                titleKey = 'dialog.shareYourScreen'>
                { this._renderTabs() }
            </Dialog>
        );
    }

    /**
     * Computes the selected source.
     *
     * @param {Object} sources - The available sources.
     * @returns {Object} The selectedSource value.
     */
    _getSelectedSource(sources: any = {}) {
        const { selectedSource } = this.state;

        /**
         * If there are no sources for this type (or no sources for any type)
         * we can't select anything.
         */
        if (!Array.isArray(sources[this._selectedTabType as keyof typeof sources])
            || sources[this._selectedTabType as keyof typeof sources].length <= 0) {
            return {};
        }

        /**
         * Select the first available source for this type in the following
         * scenarios:
         * 1) Nothing is yet selected.
         * 2) Tab change.
         * 3) The selected source is no longer available.
         */
        if (!selectedSource // scenario 1)
                || selectedSource.type !== this._selectedTabType // scenario 2)
                || !sources[this._selectedTabType].some( // scenario 3)
                        (source: any) => source.id === selectedSource.id)) {
            return {
                id: sources[this._selectedTabType][0].id,
                type: this._selectedTabType
            };
        }

        /**
         * For all other scenarios don't change the selection.
         */
        return selectedSource;
    }

    /**
     * Dispatches an action to hide the DesktopPicker and invokes the passed in
     * callback with a selectedSource, if any.
     *
     * @param {string} [id] - The id of the DesktopCapturerSource to pass into
     * the onSourceChoose callback.
     * @param {string} type - The type of the DesktopCapturerSource to pass into
     * the onSourceChoose callback.
     * @param {boolean} screenShareAudio - Whether or not to add system audio to
     * screen sharing session.
     * @returns {void}
     */
    _onCloseModal(id = '', type?: string, screenShareAudio = false) {
        this.props.onSourceChoose(id, type, screenShareAudio);
        this.props.dispatch(hideDialog());
    }

    /**
     * Sets the currently selected DesktopCapturerSource.
     *
     * @param {string} id - The id of DesktopCapturerSource.
     * @param {string} type - The type of DesktopCapturerSource.
     * @returns {void}
     */
    _onPreviewClick(id: string, type: string) {
        this.setState({
            selectedSource: {
                id,
                type
            }
        });
    }

    /**
     * Request to close the modal and execute callbacks with the selected source
     * id.
     *
     * @returns {void}
     */
    _onSubmit() {
        const { selectedSource: { id, type }, screenShareAudio } = this.state;

        this._onCloseModal(id, type, screenShareAudio);
    }

    /**
     * Stores the selected tab and updates the selected source via
     * {@code _getSelectedSource}.
     *
     * @param {Object} _tab - The configuration passed into atlaskit tabs to
     * describe how to display the selected tab.
     * @param {number} tabIndex - The index of the tab within the array of
     * displayed tabs.
     * @returns {void}
     */
    _onTabSelected(_tab: Object, tabIndex: number) {
        const { types, sources } = this.state;

        this._selectedTabType = types[tabIndex];

        // When we change tabs also reset the screenShareAudio state so we don't
        // use the option from one tab when sharing from another.
        this.setState({
            screenShareAudio: false,
            selectedSource: this._getSelectedSource(sources),
            selectedTab: tabIndex
        });
    }

    /**
     * Set the screenSharingAudio state indicating whether or not to also share
     * system audio.
     *
     * @param {boolean} checked - Share audio or not.
     * @returns {void}
     */
    _onShareAudioChecked(checked: boolean) {
        this.setState({ screenShareAudio: checked });
    }

    /**
     * Configures and renders the tabs for display.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderTabs() {
        const { selectedSource, sources, types } = this.state;
        const { t } = this.props;
        const tabs
            = types.map(
                type => {
                    return {
                        content: <DesktopPickerPane
                            key = { type }
                            onClick = { this._onPreviewClick }
                            onDoubleClick = { this._onSubmit }
                            onShareAudioChecked = { this._onShareAudioChecked }
                            selectedSourceId = { selectedSource.id }
                            sources = { sources[type as keyof typeof sources] }
                            type = { type } />,
                        label: t(TAB_LABELS[type as keyof typeof TAB_LABELS])
                    };
                });

        return (
            <Tabs
                onSelect = { this._onTabSelected }
                selected = { this.state.selectedTab }
                tabs = { tabs } />);
    }

    /**
     * Create an interval to update known available DesktopCapturerSources.
     *
     * @private
     * @returns {void}
     */
    _startPolling() {
        this._stopPolling();
        this._updateSources();
        this._poller = window.setInterval(this._updateSources, UPDATE_INTERVAL);
    }

    /**
     * Cancels the interval to update DesktopCapturerSources.
     *
     * @private
     * @returns {void}
     */
    _stopPolling() {
        window.clearInterval(this._poller);
        this._poller = null;
    }

    /**
     * Obtains the desktop sources and updates state with them.
     *
     * @private
     * @returns {void}
     */
    _updateSources() {
        const { types } = this.state;

        if (types.length > 0) {
            obtainDesktopSources(
                this.state.types,
                { thumbnailSize: THUMBNAIL_SIZE }
            )
            .then((sources: any) => {
                const selectedSource = this._getSelectedSource(sources);

                // TODO: Maybe check if we have stopped the timer and unmounted
                // the component.
                this.setState({
                    sources,
                    selectedSource
                });
            })
            .catch(() => { /* ignore */ });
        }
    }
}

export default translate(connect()(DesktopPicker));
