import React from "react";
import ZinZen from "../../images/LogoTextLight.svg";
import Logo from "../../images/zinzenlogo.png";
import "./landingpage.scss"

export const TitlePanelLeft = () => {
    return (
        <div className="left-panel">
            <img src={Logo} alt="ZinZen Logo" className="zinzen-logo-landing-page" />
            <img
                src={ZinZen}
                alt="ZinZen Text Logo"
                className="zinzen-text-logo-landing-page"
            />
            <h4 className="left-panel-font1">Realize dreams</h4>
            <h4 className="left-panel-font2">
                <i>together</i>
            </h4>
            <button className="btn-primary-learnmore">
                <span>Learn More!</span>
            </button>
        </div>
    );
};
