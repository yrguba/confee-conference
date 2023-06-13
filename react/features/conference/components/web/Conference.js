// @flow

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import _ from "lodash";
import React from "react";

import VideoLayout from "../../../../../modules/UI/videolayout/VideoLayout";
import { _isAuthenticated, saveTokenToCookie } from '../../../../utils';
import { getConferenceNameForTitle } from "../../../base/conference";
import { connect, disconnect } from "../../../base/connection";
import { isMobileBrowser } from "../../../base/environment/utils";
import { translate } from "../../../base/i18n";
import { connect as reactReduxConnect } from "../../../base/redux";
import { setColorAlpha } from "../../../base/util";
import { Chat } from "../../../chat";
import {
    MainFilmstrip,
    ScreenshareFilmstrip,
    StageFilmstrip,
} from "../../../filmstrip";
import { CalleeInfoContainer } from "../../../invite";
import { LargeVideo } from "../../../large-video";
import { LobbyScreen } from "../../../lobby";
import { getIsLobbyVisible } from "../../../lobby/functions";
import { ParticipantsPane } from "../../../participants-pane/components/web";
import Prejoin from "../../../prejoin/components/web/Prejoin";
import { isPrejoinPageVisible } from "../../../prejoin/functions";
import { toggleToolboxVisible } from "../../../toolbox/actions.any";
import { fullScreenChanged, showToolbox } from "../../../toolbox/actions.web";
import { JitsiPortal, Toolbox } from "../../../toolbox/components/web";
import { LAYOUT_CLASSNAMES, getCurrentLayout } from "../../../video-layout";
import { auth, getConferenceList } from '../../../welcome/v2/requests';
import { maybeShowSuboptimalExperienceNotification } from "../../functions";
import {
    AbstractConference,
    abstractMapStateToProps,
} from "../AbstractConference";
import type { AbstractProps } from "../AbstractConference";

import ConferenceInfo from "./ConferenceInfo";
import { default as Notice } from "./Notice";
import { checkCode, getConferenceByName, getCurrent } from "../../requests";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle, InputAdornment,
    TextField
} from '@mui/material';

declare var APP: Object;
declare var interfaceConfig: Object;

/**
 * DOM events for when full screen mode has changed. Different browsers need
 * different vendor prefixes.
 *
 * @private
 * @type {Array<string>}
 */
const FULL_SCREEN_EVENTS = [
    "webkitfullscreenchange",
    "mozfullscreenchange",
    "fullscreenchange",
];

/**
 * The type of the React {@code Component} props of {@link Conference}.
 */
type Props = AbstractProps & {
    /**
     * The alpha(opacity) of the background.
     */
    _backgroundAlpha: number,

    /**
     * The CSS class to apply to the root of {@link Conference} to modify the
     * application layout.
     */
    _layoutClassName: string,

    /**
     * The config specified interval for triggering mouseMoved iframe api events.
     */
    _mouseMoveCallbackInterval: number,

    /**
     *Whether or not the notifications should be displayed in the overflow drawer.
     */
    _overflowDrawer: boolean,

    /**
     * Name for this conference room.
     */
    _roomName: string,

    /**
     * If lobby page is visible or not.
     */
    _showLobby: boolean,

    /**
     * If prejoin page is visible or not.
     */
    _showPrejoin: boolean,

    dispatch: Function,
    t: Function,
};

/**
 * The conference page of the Web application.
 */
class Conference extends AbstractConference<Props, *> {
    _onFullScreenChange: Function;
    _onMouseEnter: Function;
    _onMouseLeave: Function;
    _onMouseMove: Function;
    _onShowToolbar: Function;
    _onVidespaceTouchStart: Function;
    _originalOnMouseMove: Function;
    _originalOnShowToolbar: Function;
    _setBackground: Function;

    /**
     * Initializes a new Conference instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        const { _mouseMoveCallbackInterval } = props;

        // Throttle and bind this component's mousemove handler to prevent it
        // from firing too often.
        this._originalOnShowToolbar = this._onShowToolbar;
        this._originalOnMouseMove = this._onMouseMove;

        this._onShowToolbar = _.throttle(
            () => this._originalOnShowToolbar(),
            100,
            {
                leading: true,
                trailing: false,
            }
        );

        this._onMouseMove = _.throttle(
            (event) => this._originalOnMouseMove(event),
            _mouseMoveCallbackInterval,
            {
                leading: true,
                trailing: false,
            }
        );

        // Bind event handler so it is only bound once for every instance.
        this._onFullScreenChange = this._onFullScreenChange.bind(this);
        this._onVidespaceTouchStart = this._onVidespaceTouchStart.bind(this);
        this._setBackground = this._setBackground.bind(this);

        this.state = {
            ...this.state,
            codeModalVisible: false,
            conferenceData: null,
            conferenceEnabled: false,
            authModalOpen: false,
            authData: {
                email: "",
                password: "",
            },
            authError: false,
            showPassword: false,
        };
    }

    _getCurrentUser() {
        return getCurrent()
            .then((user) => {
                if (user) {
                    //this._start();
                    return user;
                }
            }).catch((error: any) => error);
    }

    _getConferenceName(name) {
        return getConferenceByName(name.toLowerCase())
            .then((conference) => {
                if (conference) {
                    //this._start();
                    return conference;
                }
            })
            .catch(() => {
                window.location.href = "/";
            });
    }

    /**
     * Start the connection and get the UI ready for the conference.
     *
     * @inheritdoc
     */

    _startConference(display_name) {
        this.setState({
            conferenceEnabled: true,
            codeModalVisible: false,
            authModalOpen: false,
            authData: {
                email: "",
                password: "",
            },
            authError: false,
            showPassword: false,
        });
        document.title = display_name || interfaceConfig.APP_NAME;
        window.localStorage.setItem("currentConferenceName", display_name);
        this._start();
    }

    componentDidMount() {
        this._getCurrentUser();
        this._getConferenceName(this.props._room).then((room) => {
            if (room.needCode) {
                this.setState({
                    codeModalVisible: true,
                    conferenceData: {
                        name: room.name,
                        code: null,
                    },
                    codeError: false,
                });
            } else {
                this._startConference(room.display_name);

                // this.
                // this._startConference(room.display_name);
            }
        })



        // getConferenceByName(this.props._room)
        //     .then((conference) => {
        //         if (conference) {
        //             this._start();
        //         }
        //     })
        //     .catch(() => {
        //         window.location.href = "/";
        //     });

        //this._start();
    }

    /**
     * Calls into legacy UI to update the application layout, if necessary.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidmake(prevProps) {
        if (
            this.props._shouldDisplayTileView ===
            prevProps._shouldDisplayTileView
        ) {
            return;
        }

        // TODO: For now VideoLayout is being called as LargeVideo and Filmstrip
        // sizing logic is still handled outside of React. Once all components
        // are in react they should calculate size on their own as much as
        // possible and pass down sizings.
        VideoLayout.refreshLayout();
    }

    /**
     * Disconnect from the conference when component will be
     * unmounted.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        APP.UI.unbindEvents();

        FULL_SCREEN_EVENTS.forEach((name) =>
            document.removeEventListener(name, this._onFullScreenChange)
        );

        APP.conference.isJoined() && this.props.dispatch(disconnect());
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _layoutClassName,
            _notificationsVisible,
            _overflowDrawer,
            _showLobby,
            _showPrejoin,
        } = this.props;

        return (
            <div
                id="layout_wrapper"
                onMouseEnter={this._onMouseEnter}
                onMouseLeave={this._onMouseLeave}
                onMouseMove={this._onMouseMove}
                ref={this._setBackground}
            >
                {this.state.conferenceEnabled && (
                    <>
                        <Chat />
                        <div
                            className={_layoutClassName}
                            id="videoconference_page"
                            onMouseMove={
                                isMobileBrowser()
                                    ? undefined
                                    : this._onShowToolbar
                            }
                        >
                            <ConferenceInfo />
                            <Notice />
                            <div
                                id="videospace"
                                onTouchStart={this._onVidespaceTouchStart}
                            >
                                <LargeVideo />
                                {_showPrejoin || _showLobby || (
                                    <>
                                        <StageFilmstrip />
                                        <ScreenshareFilmstrip />
                                        <MainFilmstrip />
                                    </>
                                )}
                            </div>
                            {_showPrejoin || _showLobby || <Toolbox />}
                            {_notificationsVisible &&
                                (_overflowDrawer ? (
                                    <JitsiPortal className="notification-portal">
                                        {this.renderNotificationsContainer({
                                            portal: true,
                                        })}
                                    </JitsiPortal>
                                ) : (
                                    this.renderNotificationsContainer()
                                ))}
                            <CalleeInfoContainer />
                            {_showPrejoin && !_isAuthenticated() && <Prejoin />}
                            {_showLobby && <LobbyScreen />}
                        </div>
                        <ParticipantsPane />
                    </>
                )}

                <Dialog
                    open={this.state.codeModalVisible}
                    onClose={() => {
                        window.location.href = "/";
                        this.setState({ codeModalVisible: false });
                    }}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle id="alert-dialog-title">
                        Для доступа к конференции необходимо ввести пин-код
                    </DialogTitle>
                    <DialogContent>
                        <TextField
                            value={this.state.conferenceData?.code || ""}
                            label="Пин-код"
                            variant="outlined"
                            sx={{
                                width: "100%",
                                marginTop: "20px",
                            }}
                            placeholder="Введите пин-код"
                            onChange={(event) => {
                                this.setState({
                                    conferenceData: {
                                        ...this.state.conferenceData,
                                        code: event.target.value.replace(
                                            /[^0-9]/g,
                                            ""
                                        ),
                                    },
                                });
                            }}
                            inputProps={{
                                maxLength: 10,
                                minLength: 10,
                            }}
                        />
                        {this.state.codeError && (
                            <p
                                style={{
                                    color: "#d62439",
                                    marginTop: "5px",
                                }}
                            >
                                Пин-код неверный
                            </p>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => {
                                this.setState({
                                    codeError: false,
                                });

                                window.location.href = "/";
                            }}
                        >
                            Закрыть
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                checkCode(this.state.conferenceData)
                                    .then((conference) => {
                                        this._startConference(
                                            conference.display_name
                                        );
                                    })
                                    .catch(() => {
                                        this.setState({
                                            codeError: true,
                                            conferenceEnabled: false,
                                        });
                                    });
                            }}
                        >
                            Войти
                        </Button>
                    </DialogActions>
                </Dialog>
                <Dialog
                    open={this.state.authModalOpen}
                    //onClose={() => this.setState({ authModalOpen: false })}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle id="alert-dialog-title">
                        Авторизация в Confee
                    </DialogTitle>
                    <DialogContent>
                        <TextField
                            label="Ваш Email"
                            variant="outlined"
                            sx={{
                                width: "100%",
                                marginTop: "20px",
                            }}
                            placeholder="Введите Email"
                            onChange={(event) => {
                                this.setState({
                                    authData: {
                                        ...this.state.authData,
                                        email: event.target.value,
                                    },
                                });
                            }}
                        />
                        <TextField
                            label="Ваш Пароль"
                            variant="outlined"
                            type={this.state.showPassword ? "text" : "password"}
                            sx={{
                                width: "100%",
                                marginTop: "20px",
                            }}
                            placeholder="Введите пароль"
                            onChange={(event) => {
                                this.setState({
                                    authData: {
                                        ...this.state.authData,
                                        password: event.target.value,
                                    },
                                });
                            }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment
                                        position="end"
                                        sx={{
                                            cursor: "pointer",
                                        }}
                                        onClick={() => {
                                            this.setState({
                                                showPassword:
                                                    !this.state.showPassword,
                                            });
                                        }}
                                    >
                                        {this.state.showPassword ? (
                                            <VisibilityOff />
                                        ) : (
                                            <Visibility />
                                        )}
                                    </InputAdornment>
                                ),
                            }}
                        />
                        {this.state.authError && (
                            <p
                                style={{
                                    color: "#d62439",
                                    marginTop: "5px",
                                }}
                            >
                                Email или пароль неверные
                            </p>
                        )}
                    </DialogContent>
                    <DialogActions>
                        {_isAuthenticated() && (
                            <Button
                                onClick={() =>
                                    this.setState({
                                        authModalOpen: false,
                                        authError: false,
                                    })
                                }
                            >
                                Закрыть
                            </Button>
                        )}

                        <Button
                            variant="outlined"
                            onClick={() => {
                                auth(this.state.authData)
                                    .then((token) => {
                                        if (token) {
                                            this.setState({
                                                authModalOpen: false,
                                                authError: false,
                                            });
                                            saveTokenToCookie(token);
                                            window.location.reload();
                                        }
                                    })
                                    .catch(() => {
                                        this.setState({
                                            authError: true,
                                        });
                                    });
                            }}
                        >
                            Войти
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }

    /**
     * Sets custom background opacity based on config. It also applies the
     * opacity on parent element, as the parent element is not accessible directly,
     * only though it's child.
     *
     * @param {Object} element - The DOM element for which to apply opacity.
     *
     * @private
     * @returns {void}
     */
    _setBackground(element) {
        if (!element) {
            return;
        }

        if (this.props._backgroundAlpha !== undefined) {
            const elemColor = element.style.background;
            const alphaElemColor = setColorAlpha(
                elemColor,
                this.props._backgroundAlpha
            );

            element.style.background = alphaElemColor;
            if (element.parentElement) {
                const parentColor = element.parentElement.style.background;
                const alphaParentColor = setColorAlpha(
                    parentColor,
                    this.props._backgroundAlpha
                );

                element.parentElement.style.background = alphaParentColor;
            }
        }
    }

    /**
     * Handler used for touch start on Video container.
     *
     * @private
     * @returns {void}
     */
    _onVidespaceTouchStart() {
        this.props.dispatch(toggleToolboxVisible());
    }

    /**
     * Updates the Redux state when full screen mode has been enabled or
     * disabled.
     *
     * @private
     * @returns {void}
     */
    _onFullScreenChange() {
        this.props.dispatch(fullScreenChanged(APP.UI.isFullScreen()));
    }

    /**
     * Triggers iframe API mouseEnter event.
     *
     * @param {MouseEvent} event - The mouse event.
     * @private
     * @returns {void}
     */
    _onMouseEnter(event) {
        APP.API.notifyMouseEnter(event);
    }

    /**
     * Triggers iframe API mouseLeave event.
     *
     * @param {MouseEvent} event - The mouse event.
     * @private
     * @returns {void}
     */
    _onMouseLeave(event) {
        APP.API.notifyMouseLeave(event);
    }

    /**
     * Triggers iframe API mouseMove event.
     *
     * @param {MouseEvent} event - The mouse event.
     * @private
     * @returns {void}
     */
    _onMouseMove(event) {
        APP.API.notifyMouseMove(event);
    }

    /**
     * Displays the toolbar.
     *
     * @private
     * @returns {void}
     */
    _onShowToolbar() {
        this.props.dispatch(showToolbox());
    }

    /**
     * Until we don't rewrite UI using react components
     * we use UI.start from old app. Also method translates
     * component right after it has been mounted.
     *
     * @inheritdoc
     */
    _start() {
        APP.UI.start();

        APP.UI.registerListeners();
        APP.UI.bindEvents();

        FULL_SCREEN_EVENTS.forEach((name) =>
            document.addEventListener(name, this._onFullScreenChange)
        );

        const { dispatch, t } = this.props;

        dispatch(connect());

        maybeShowSuboptimalExperienceNotification(dispatch, t);
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code Conference} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const { backgroundAlpha, mouseMoveCallbackInterval } =
        state["features/base/config"];
    const { overflowDrawer } = state["features/toolbox"];

    return {
        ...abstractMapStateToProps(state),
        _backgroundAlpha: backgroundAlpha,
        _layoutClassName: LAYOUT_CLASSNAMES[getCurrentLayout(state)],
        _mouseMoveCallbackInterval: mouseMoveCallbackInterval,
        _overflowDrawer: overflowDrawer,
        _roomName: getConferenceNameForTitle(state),
        _showLobby: getIsLobbyVisible(state),
        _showPrejoin: isPrejoinPageVisible(state),
    };
}

export default reactReduxConnect(_mapStateToProps)(translate(Conference));
