/* global interfaceConfig */

import {
    Button,
    IconButton,
    Popper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    Box,
    TextField,
    DialogActions,
    InputAdornment,
    Avatar,
} from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import React from "react";
import { confeeDecode, confeeEncode } from "../../../utils";

import { isMobileBrowser } from "../../base/environment/utils";
import { translate, translateToHTML } from "../../base/i18n";
import { Icon, IconWarning } from "../../base/icons";
import { connect } from "../../base/redux";
import { RecentList } from "../../recent-list";
import { SETTINGS_TABS, SettingsButton } from "../../settings";

import { AbstractWelcomePage, _mapStateToProps } from "./AbstractWelcomePage";
import Tabs from "./Tabs";

import InviteByEmailSection from "../../invite/components/add-people-dialog/web/InviteByEmailSection";

import {
  auth,
  getCurrent,
  createConference,
  deleteConference,
  getConferenceList,
} from "../v2/requests";
import { saveTokenToCookie, _isAuthenticated, signOut } from "../../../utils";
import { DeleteOutlined } from "@mui/icons-material";
import LogoutIcon from "@mui/icons-material/Logout";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockIcon from "@mui/icons-material/Lock";

/**
 * The pattern used to validate room name.
 *
 * @type {string}
 */
export const ROOM_NAME_VALIDATE_PATTERN_STR = "^[^?&:\u0022\u0027%#]+$";

const makeCode = (length) => {
  let result = "";
  const characters = "0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result.toString();
};

export const styles = {
  wrapper: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "start",
    width: "100%",
    height: "100vh",
    background: "#0E1621 !important",
  },

  logout: {
    marginLeft: "20px",
  },
};

/**
 * The Web container rendering the welcome page.
 *
 * @augments AbstractWelcomePage
 */

// const inviteSubject = t('addPeople.inviteMoreMailSubject', {
//     appName: _inviteAppName ?? interfaceConfig.APP_NAME
// });

class WelcomePage extends AbstractWelcomePage {
  /**
   * Default values for {@code WelcomePage} component's properties.
   *
   * @static
   */
  static defaultProps = {
    _room: "",
  };

  /**
   * Initializes a new WelcomePage instance.
   *
   * @param {Object} props - The read-only properties with which the new
   * instance is to be initialized.
   */
  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      generateRoomnames: interfaceConfig.GENERATE_ROOMNAMES_ON_WELCOME_PAGE,
      selectedTab: 0,
      isPrivate: false,
      currentName: "",
      currentUser: null,
      code: makeCode(4),
      open: false,
      newConfModalOpen: false,
      authModalOpen: false,
      authData: {
        email: "",
        password: "",
      },
      authError: false,
      linkCopiedOpen: false,
      currentNameError: false,
      generatedLink: "",
      anchorEl: null,
      conferenceList: [],
      targetConference: null,
      targetConferenceForDelete: null,
      deleteConferenceModalOpen: false,
      pinCodeVisible: false,
      currentPin: null,
      pinError: null,
      conferenceNameError: "",
      showPassword: false,
    };

    /**
     * The HTML Element used as the container for additional content. Used
     * for directly appending the additional content template to the dom.
     *
     * @private
     * @type {HTMLTemplateElement|null}
     */
    this._additionalContentRef = null;

    this._roomInputRef = null;

    /**
     * The HTML Element used as the container for additional toolbar content. Used
     * for directly appending the additional content template to the dom.
     *
     * @private
     * @type {HTMLTemplateElement|null}
     */
    this._additionalToolbarContentRef = null;

    this._additionalCardRef = null;

    /**
     * The template to use as the additional card displayed near the main one.
     *
     * @private
     * @type {HTMLTemplateElement|null}
     */
    this._additionalCardTemplate = document.getElementById(
      "welcome-page-additional-card-template"
    );

    /**
     * The template to use as the main content for the welcome page. If
     * not found then only the welcome page head will display.
     *
     * @private
     * @type {HTMLTemplateElement|null}
     */
    this._additionalContentTemplate = document.getElementById(
      "welcome-page-additional-content-template"
    );

    /**
     * The template to use as the additional content for the welcome page header toolbar.
     * If not found then only the settings icon will be displayed.
     *
     * @private
     * @type {HTMLTemplateElement|null}
     */
    this._additionalToolbarContentTemplate = document.getElementById(
      "settings-toolbar-additional-content-template"
    );

    // Bind event handlers so they are only bound once per instance.
    this._onFormSubmit = this._onFormSubmit.bind(this);
    this._handleClick = this._handleClick.bind(this);
    this._onRoomChange = this._onRoomChange.bind(this);
    this._setAdditionalCardRef = this._setAdditionalCardRef.bind(this);
    this._setAdditionalContentRef = this._setAdditionalContentRef.bind(this);
    this._setRoomInputRef = this._setRoomInputRef.bind(this);
    this._setAdditionalToolbarContentRef =
      this._setAdditionalToolbarContentRef.bind(this);
    this._onTabSelected = this._onTabSelected.bind(this);
  }

  /**
   * Implements React's {@link Component#componentDidMount()}. Invoked
   * immediately after this component is mounted.
   *
   * @inheritdoc
   * @returns {void}
   */
  componentDidMount() {
    super.componentDidMount();

    document.body.classList.add("welcome-page");
    document.title = interfaceConfig.APP_NAME;

    if (this.state.generateRoomnames) {
      this._updateRoomname();
    }

    if (this._shouldShowAdditionalContent()) {
      this._additionalContentRef.appendChild(
        this._additionalContentTemplate.content.cloneNode(true)
      );
    }

    if (this._shouldShowAdditionalToolbarContent()) {
      this._additionalToolbarContentRef.appendChild(
        this._additionalToolbarContentTemplate.content.cloneNode(true)
      );
    }

    if (this._shouldShowAdditionalCard()) {
      this._additionalCardRef.appendChild(
        this._additionalCardTemplate.content.cloneNode(true)
      );
    }

    if (!_isAuthenticated()) {
      this.setState({
        authModalOpen: true,
      });
    }

    if (_isAuthenticated()) {
      getCurrent().then((data) => {
        this.setState({
          currentUser: data,
        });
      });

      getConferenceList().then((data) => {
        this.setState({
          conferenceList: data,
        });
      });
    }
  }

  /**
   * Removes the classname used for custom styling of the welcome page.
   *
   * @inheritdoc
   * @returns {void}
   */
  componentWillUnmount() {
    super.componentWillUnmount();

    document.body.classList.remove("welcome-page");
  }

  /**
   * Implements React's {@link Component#render()}.
   *
   * @inheritdoc
   * @returns {ReactElement|null}
   */

  render() {
    const { _moderatedRoomServiceUrl, t } = this.props;
    const { DEFAULT_WELCOME_PAGE_LOGO_URL, DISPLAY_WELCOME_FOOTER } =
      interfaceConfig;
    const showAdditionalCard = this._shouldShowAdditionalCard();
    const showAdditionalContent = this._shouldShowAdditionalContent();
    const showAdditionalToolbarContent =
      this._shouldShowAdditionalToolbarContent();
    const contentClassName = showAdditionalContent
      ? "with-content"
      : "without-content";
    const footerClassName = DISPLAY_WELCOME_FOOTER
      ? "with-footer"
      : "without-footer";

    return (
      <div
        style={styles.wrapper}
        onClick={() => {
          if (this.state.open) {
            this.setState({ open: false });
          }
        }}
      >
        <header className="main-header">
          <div className="main-header-wrapper">
            <img src="/images/watermark.svg" style={{ width: "120px" }} />
            {this.state.currentUser &&
              this.state.currentUser?.organizations &&
              this.state.currentUser.organizations[0]?.avatar && (
                <img
                  src={`https://admin.confee.ru${this.state.currentUser?.organizations[0]?.avatar}`}
                  style={{
                    height: "50px",
                    marginLeft: "16px",
                  }}
                />
              )}
          </div>
          <div className="main-header-wrapper">
            {_isAuthenticated() && this.state.currentUser && (
              <>
                <div className="main-header-info">
                  <p className="main-header-info-name">
                    {this.state.currentUser.display_name ? this.state.currentUser.display_name : this.state.currentUser.name}
                  </p>
                  <p>{this.state.currentUser.email}</p>
                </div>
                {!this.state.currentUser.avatar && (
                  <Avatar sx={{ bgcolor: "#56BB60" }}>
                    {this.state.currentUser.display_name
                      ? this.state.currentUser.display_name[0].toUpperCase()
                      : this.state.currentUser.name[0].toUpperCase()}
                  </Avatar>
                )}
                {!!this.state.currentUser.avatar && (
                  <Avatar
                    alt={this.state.currentUser.name}
                    src={`https://admin.confee.ru${this.state.currentUser.avatar}`}
                  />
                )}

                <div style={styles.logout} onClick={() => signOut()}>
                  <LogoutIcon />
                </div>
              </>
            )}
          </div>
        </header>
        <main className="main">
          <div className="main-conference-create">
            <div className="main-conference-create-wrapper">
              <input
                type="text"
                placeholder="Название конференции"
                style={{
                  width: "calc(100% - 20px)",
                  height: "60px",
                  background: "transparent",
                  paddingLeft: "16px",
                  color: "#fff",
                  border: "1px solid #B8C7E0",
                  borderRadius: "10px",
                  fontSize: "16px",
                }}
                onChange={(event) => {
                  if (event.target.value.length < 31) {
                    this.setState({
                      currentName: event.target.value.trim(),
                      conferenceNameError: "",
                    });
                  } else {
                    this.setState({
                      conferenceNameError:
                        "Название конференции может содержать максимум 30 символов",
                    });
                  }
                }}
                maxLength={30}
              />
              {!this.state.pinCodeVisible && (
                <div
                  style={{
                    color: "#1976d2",
                    fontWeight: 500,
                    marginTop: "10px",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    this.setState({
                      pinCodeVisible: true,
                      currentPin: this._makeRandomNumber(6),
                    });
                  }}
                >
                  Добавить пин-код для доступа к конференции
                </div>
              )}
              {this.state.pinCodeVisible && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginTop: "20px",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Пин-код конференции"
                    style={{
                      width: "calc(100% - 60px)",
                      height: "60px",
                      background: "transparent",
                      paddingLeft: "16px",
                      color: "#fff",
                      border: "1px solid #B8C7E0",
                      borderRadius: "10px",
                      fontSize: "16px",
                    }}
                    value={this.state.currentPin}
                    maxLength={10}
                    onChange={(event) => {
                      this.setState({
                        currentPin: event.target.value.replace(/[^0-9]/g, ""),
                      });
                    }}
                  />
                  <DeleteOutlined
                    style={{ marginLeft: "10px" }}
                    onClick={() => {
                      this.setState({
                        pinError: null,
                        pinCodeVisible: false,
                        currentPin: null,
                      });
                    }}
                  />
                  {this.state.pinError && (
                    <p
                      style={{
                        color: "#d62439",
                        marginTop: "5px",
                      }}
                    >
                      {this.state.pinError}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="main-conference-create-wrapper-actions">
              <Button
                  sx={{
                    backgroundColor: "#7B57C8",
                    height: "60px",
                    color: "#fff",
                    textTransform: "capitalize",
                    fontSize: "16px",
                  }}
                  variant="outlined"
                  onClick={() => {
                    if (
                        this.state.currentPin === "" ||
                        (this.state.currentPin && this.state.currentPin?.length < 4)
                    ) {
                      this.setState({
                        pinError: "Пин-код должен состоять как минимум из 4 цифр",
                      });
                    } else {
                      this.setState({
                        pinError: null,
                        pinCodeVisible: false,
                      });

                      if (!!this.state.currentName) {
                        createConference({
                          display_name: this.state.currentName,
                          code: this.state.currentPin,
                        }).then(() => {
                          this.setState({
                            newConfModalOpen: false,
                          });
                          getConferenceList().then((data) => {
                            this.setState({
                              conferenceList: data,
                            });
                          });
                        });
                      } else {
                        this.setState({
                          conferenceNameError: "Введите название конференции",
                        });
                      }
                    }
                  }}
              >
                Создать конференцию
              </Button>
              <div
                  className="welcome-page-settings"
                  style={{ marginTop: "5px", marginLeft: "5px" }}
              >
                <SettingsButton
                    defaultTab={SETTINGS_TABS.CALENDAR}
                    isDisplayedOnWelcomePage={true}
                />
                {showAdditionalToolbarContent ? (
                    <div
                        className="settings-toolbar-content"
                        ref={this._setAdditionalToolbarContentRef}
                    />
                ) : null}
              </div>
            </div>

          </div>
        </main>
        <aside className="main-aside">
          <h2 style={{ fontSize: "25px", padding: "20px" }}>Мои конференции</h2>
          {_isAuthenticated() && !this.state.conferenceList?.length && (
            <p style={{ padding: "20px" }}>
              У вас пока нет ни одной конферениции
            </p>
          )}
          {!!this.state.conferenceList?.length && _isAuthenticated() && (
            <Box
              sx={{
                height: "calc(100% - 70px)",
                overflow: "auto",
                padding: "0 20px",
              }}
            >
              {this.state.conferenceList.map((conference) => (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: window.innerWidth > 768 ? "row" : "column",
                    fontSize: "20px",
                    alignItems:
                      window.innerWidth > 768 ? "center" : "flex-start",
                    justifyContent: "space-between",
                    padding: "16px",
                    background: "#2B333E",
                    borderRadius: "10px",
                    marginBottom: "8px",
                    // borderBottom: "1px solid #555",
                    // borderBottom: "1px solid #555",
                    // borderLeft: "1px solid #555",
                    // borderRight: "1px solid #555",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: window.innerWidth > 768 ? 0 : "16px",
                    }}
                  >
                    {!!conference.code && <LockIcon fontSize="small" />}
                    <span style={{ marginLeft: "4px" }}>
                      {conference.display_name}
                    </span>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Button
                      onClick={() => {
                        window.location.href = `${window.location.href}${conference.name}`;
                      }}
                      variant="contained"
                      sx={{
                        backgroundColor: "#7B57C8",
                        color: "#fff",
                        textTransform: "capitalize",
                        fontSize: "16px",
                        marginRight: "16px",
                      }}
                    >
                      Начать
                    </Button>
                    <Button
                      onClick={(event) => {
                        window.localStorage.setItem(
                          "currentConferenceName",
                          `«${conference.display_name}»${
                            conference.code ? `, Код - ${conference.code}` : ""
                          }`
                        );
                        this.setState({
                          anchorEl: event.target,
                          open: true,
                          targetConference: conference,
                        });
                      }}
                      startIcon={<ShareIcon />}
                      sx={{
                        color: "#fff",
                        textTransform: "capitalize",
                        fontSize: "16px",
                      }}
                    >
                      Поделиться
                    </Button>
                    <DeleteOutlined
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        this.setState({
                          targetConferenceForDelete: conference,
                          deleteConferenceModalOpen: true,
                        });
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </aside>
        <Dialog
          open={this.state.deleteConferenceModalOpen}
          onClose={() =>
            this.setState({
              deleteConferenceModalOpen: false,
            })
          }
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            Удаление конференции
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {`Вы действительно хотите удалить конференцию - ${this.state.targetConferenceForDelete?.display_name} ?`}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() =>
                this.setState({
                  deleteConferenceModalOpen: false,
                })
              }
            >
              Закрыть
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                deleteConference(this.state.targetConferenceForDelete?.id).then(
                  () => {
                    this.setState({
                      deleteConferenceModalOpen: false,
                    });
                    getConferenceList().then((data) => {
                      this.setState({
                        conferenceList: data,
                      });
                    });
                  }
                );
              }}
            >
              Удалить
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
                        showPassword: !this.state.showPassword,
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
              // InputProps={{
              //     endAdornment:
              //     <InputAdornment position="end">
              //     <IconButton
              //     onClick={() => {
              //     this.setState({
              //     showPassword:
              //     !this.state
              //     .showPassword,
              // });
              // }}
              //     >
              // {this.state
              //     .showPassword ? (
              //     <VisibilityOff />
              //     ) : (
              //     <Visibility />
              //     )}
              //     </IconButton>
              //     </InputAdornment>
              // }
              // }}
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

                      getCurrent().then((data) => {
                        this.setState({
                          currentUser: data,
                        });
                      });

                      getConferenceList().then((data) => {
                        this.setState({
                          conferenceList: data,
                        });
                      });
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
        {this.state.targetConference && (
          <Popper
            open={this.state.open}
            anchorEl={this.state.anchorEl}
            placement="bottom-start"
            style={{
              background: "#333",
              display: "flex",
              flexDirection: "column",
              zIndex: 100,
              padding: "20px",
              borderRadius: "5px",
              maxWidth: window.innerWidth < 440 ? "300px" : "440px",
            }}
          >
            <Box className="confee-share-list">
              <InviteByEmailSection
                inviteSubject={"Confee. Приглашение в конференцию"}
                inviteText={this.state.targetConference.display_name}
                inviteLink={`${window.location.href}${this.state.targetConference.name}`}
                inviteTextiOS={this.state.targetConference.display_name}
              />
            </Box>
          </Popper>
        )}
      </div>
    );
  }

  _handleClick(event) {
    event.preventDefault();

    if (!this.state.currentName) {
      const randomRoomName = `Моя конференция ${this._makeRandomNumber(3)}`;
      this.setState({
        currentName: randomRoomName,
        newConfModalOpen: true,
        generatedLink: this._generateNewLink(randomRoomName),
      });
    } else {
      this.setState({ newConfModalOpen: true });
      this.setState({ generatedLink: this._generateNewLink() });
    }
  }

  _generateNewLink(name = this.state.currentName) {
    return `${window.location.href}${confeeEncode(name)}`;
  }

  _makeRandomString(length) {
    let result = "";
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

  _makeRandomNumber(length) {
    let result = "";
    const characters = "0123456789";
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }
  /**
   * Renders the insecure room name warning.
   *
   * @inheritdoc
   */
  _doRenderInsecureRoomNameWarning() {
    return (
      <div className="insecure-room-name-warning">
        <Icon src={IconWarning} />
        <span>{this.props.t("security.insecureRoomNameWarning")}</span>
      </div>
    );
  }

  /**
   * Prevents submission of the form and delegates join logic.
   *
   * @param {Event} event - The HTML Event which details the form submission.
   * @private
   * @returns {void}
   */
  _onFormSubmit(event) {
    event.preventDefault();
    if (!this._roomInputRef || this._roomInputRef.reportValidity()) {
      this._onJoin(confeeEncode(this.state.currentName));
    }
  }

  /**
   * Overrides the super to account for the differences in the argument types
   * provided by HTML and React Native text inputs.
   *
   * @inheritdoc
   * @override
   * @param {Event} event - The (HTML) Event which details the change such as
   * the EventTarget.
   * @protected
   */
  _onRoomChange(event) {
    super._onRoomChange(event.target.value);
    this.setState({ currentName: event.target.value });
  }

  /**
   * Callback invoked when the desired tab to display should be changed.
   *
   * @param {number} tabIndex - The index of the tab within the array of
   * displayed tabs.
   * @private
   * @returns {void}
   */
  _onTabSelected(tabIndex) {
    this.setState({ selectedTab: tabIndex });
  }

  /**
   * Renders tabs to show previous meetings and upcoming calendar events. The
   * tabs are purposefully hidden on mobile browsers.
   *
   * @returns {ReactElement|null}
   */
  _renderTabs() {
    if (isMobileBrowser()) {
      return null;
    }

    const { _calendarEnabled, _recentListEnabled, t } = this.props;

    const tabs = [];

    // if (_calendarEnabled) {
    //     tabs.push({
    //         label: t('welcomepage.upcomingMeetings'),
    //         content: <CalendarList />
    //     });
    // }

    if (_recentListEnabled) {
      tabs.push({
        label: t("welcomepage.recentMeetings"),
        content: <RecentList />,
      });
    }

    if (tabs.length === 0) {
      return null;
    }

    return (
      <Tabs
        onSelect={this._onTabSelected}
        selected={this.state.selectedTab}
        tabs={tabs}
      />
    );
  }

  /**
   * Sets the internal reference to the HTMLDivElement used to hold the
   * additional card shown near the tabs card.
   *
   * @param {HTMLDivElement} el - The HTMLElement for the div that is the root
   * of the welcome page content.
   * @private
   * @returns {void}
   */
  _setAdditionalCardRef(el) {
    this._additionalCardRef = el;
  }

  /**
   * Sets the internal reference to the HTMLDivElement used to hold the
   * welcome page content.
   *
   * @param {HTMLDivElement} el - The HTMLElement for the div that is the root
   * of the welcome page content.
   * @private
   * @returns {void}
   */
  _setAdditionalContentRef(el) {
    this._additionalContentRef = el;
  }

  /**
   * Sets the internal reference to the HTMLDivElement used to hold the
   * toolbar additional content.
   *
   * @param {HTMLDivElement} el - The HTMLElement for the div that is the root
   * of the additional toolbar content.
   * @private
   * @returns {void}
   */
  _setAdditionalToolbarContentRef(el) {
    this._additionalToolbarContentRef = el;
  }

  /**
   * Sets the internal reference to the HTMLInputElement used to hold the
   * welcome page input room element.
   *
   * @param {HTMLInputElement} el - The HTMLElement for the input of the room name on the welcome page.
   * @private
   * @returns {void}
   */
  _setRoomInputRef(el) {
    this._roomInputRef = el;
  }

  /**
   * Returns whether or not an additional card should be displayed near the tabs.
   *
   * @private
   * @returns {boolean}
   */
  _shouldShowAdditionalCard() {
    return (
      interfaceConfig.DISPLAY_WELCOME_PAGE_ADDITIONAL_CARD &&
      this._additionalCardTemplate &&
      this._additionalCardTemplate.content &&
      this._additionalCardTemplate.innerHTML.trim()
    );
  }

  /**
   * Returns whether or not additional content should be displayed below
   * the welcome page's header for entering a room name.
   *
   * @private
   * @returns {boolean}
   */
  _shouldShowAdditionalContent() {
    return (
      interfaceConfig.DISPLAY_WELCOME_PAGE_CONTENT &&
      this._additionalContentTemplate &&
      this._additionalContentTemplate.content &&
      this._additionalContentTemplate.innerHTML.trim()
    );
  }

  /**
   * Returns whether or not additional content should be displayed inside
   * the header toolbar.
   *
   * @private
   * @returns {boolean}
   */
  _shouldShowAdditionalToolbarContent() {
    return (
      interfaceConfig.DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT &&
      this._additionalToolbarContentTemplate &&
      this._additionalToolbarContentTemplate.content &&
      this._additionalToolbarContentTemplate.innerHTML.trim()
    );
  }
}

export default translate(connect(_mapStateToProps)(WelcomePage));
