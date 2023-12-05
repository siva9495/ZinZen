import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";

import { unarchiveIcon } from "@src/assets";

import { GoalItem } from "@src/models/GoalItem";
import { unarchiveUserGoal } from "@src/api/GoalsAPI";
import { replaceUrlsWithText, summarizeUrl } from "@src/utils/patterns";
import { calculateDaysLeft, formatBudgetHrsToText } from "@src/utils";

import { darkModeState, displayPartnerMode, lastAction } from "@src/store";
import { displayGoalId, displayUpdateGoal, goalsHistory, displayChangesModal } from "@src/store/GoalsState";
import NotificationSymbol from "@src/common/NotificationSymbol";

import { jumpToLowestChanges, getHistoryUptoGoal } from "@src/helpers/GoalProcessor";
import GoalAvatar from "./GoalAvatar";

interface MyGoalProps {
  goal: GoalItem;
  showActions: {
    open: string;
    click: number;
  };
  setShowActions: React.Dispatch<
    React.SetStateAction<{
      open: string;
      click: number;
      // eslint-disable-next-line prettier/prettier
    }>
  >;
}

const GoalSent = ({ goal }: { goal: GoalItem }) => {
  const { t } = useTranslation();
  const onLength = goal.on.length;
  const onWeekdays = onLength === 5 && !goal.on.includes("Sat") && !goal.on.includes("Sun");
  const onWeekends = onLength === 2 && goal.on.includes("Sat") && goal.on.includes("Sun");

  const hasStarted = !!goal.start && new Date(goal.start).getTime() < new Date().getTime();
  const showStart = !!goal.due || !hasStarted;

  const hoursPerDayText = formatBudgetHrsToText(goal.timeBudget.perDay);
  const hoursPerWeekText = formatBudgetHrsToText(goal.timeBudget.perWeek);
  const dueDateText = goal.due ? calculateDaysLeft(goal.due) : null;

  return (
    <>
      <div>
        {goal.timeBudget.perDay === null &&
          (goal.duration !== null ? (
            <span>
              {goal.duration} {t(`hour${Number(goal.duration) > 1 ? "s" : ""}`)}
            </span>
          ) : !goal.due ? (
            <span>{t("noDuration")}</span>
          ) : null)}
        {goal.timeBudget.perDay && <span>{hoursPerDayText}</span>}
        {goal.timeBudget.perDay && (
          <span>
            {onLength > 0 &&
              !onWeekdays &&
              !onWeekends &&
              (onLength === 7 ? ` ${t("daily")}` : ` ${t("on")} ${goal.on.map((ele) => t(ele)).join(" ")}`)}
            {onWeekdays && ` ${t("on")} ${t("weekdays")}`}
            {onWeekends && " on weekends"}
          </span>
        )}
      </div>
      <div>
        {goal.beforeTime && goal.afterTime
          ? `${t("between")} ${goal.afterTime}-${goal.beforeTime}`
          : goal.beforeTime
          ? `${t("before")} ${goal.beforeTime}`
          : goal.afterTime
          ? `${t("after")} ${goal.afterTime}`
          : ""}
      </div>
      <div>{goal.timeBudget.perWeek && <span>{`${hoursPerWeekText} per week`}</span>}</div>
      {showStart && !!goal.start && (
        <div>
          {hasStarted ? t("started") : t("starts")} {new Date(goal.start).toDateString().slice(4)}
        </div>
      )}
      <div>{goal.due && <div>{dueDateText}</div>}</div>
      <div>{goal.habit === "weekly" && `${t("every")} week`}</div>
    </>
  );
};

const MyGoal: React.FC<MyGoalProps> = ({ goal, showActions, setShowActions }) => {
  const archived = goal.archived === "true";
  const defaultTap = { open: "root", click: 1 };
  const isActionVisible = !archived && showActions.open === goal.id && showActions.click > 0;

  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  // const sharedWithContact = goal.shared.contacts.length > 0 ? goal.shared.contacts[0].name : null;
  // const collabWithContact =
  //   goal.collaboration.collaborators.length > 0 ? goal.collaboration.collaborators[0].name : null;
  const setLastAction = useSetRecoilState(lastAction);
  const darkModeStatus = useRecoilValue(darkModeState);
  const showUpdateGoal = useRecoilValue(displayUpdateGoal);
  const showPartnerMode = useRecoilValue(displayPartnerMode);
  const [selectedGoalId, setSelectedGoalId] = useRecoilState(displayGoalId);
  const [subGoalHistory, setSubGoalHistory] = useRecoilState(goalsHistory);
  const [showChangesModal, setShowChangesModal] = useRecoilState(displayChangesModal);

  const { urlsWithIndexes, replacedString } = replaceUrlsWithText(t(goal.title));

  const handleGoalClick = () => {
    if (showActions.open === goal.id && showActions.click > 0) {
      navigate("/MyGoals", {
        state: {
          ...location.state,
          activeGoalId: goal.id,
          goalsHistory: [
            ...subGoalHistory,
            {
              goalID: goal.id || "root",
              goalColor: goal.goalColor || "#ffffff",
              goalTitle: goal.title || "",
            },
          ],
        },
      });
    } else {
      setShowActions({ open: goal.id, click: 1 });
    }
  };
  async function handleDropDown(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    e.stopPropagation();
    if (showPartnerMode && goal.parentGoalId !== "root") {
      return;
    }
    const navState = { ...location.state, from: "" };
    if (goal.newUpdates) {
      navState.displayChanges = goal;
    } else {
      navState.displayGoalActions = goal;
      console.log("in navstate, displayGoalActions: ", navState);
    }
    navigate("/MyGoals", { state: navState });
  }
  useEffect(() => {
    if (showActions !== defaultTap) {
      setShowActions(defaultTap);
    }
  }, [showChangesModal, showUpdateGoal, selectedGoalId]);

  useEffect(() => {
    if (location && location.pathname === "/MyGoals") {
      const { expandedGoalId } = location.state || {};
      if (expandedGoalId && showActions.open !== expandedGoalId) {
        setShowActions({ open: expandedGoalId, click: 1 });
      }
    }
  }, [location]);

  const hasSubGoals = goal.sublist.length > 0;
  const outerBackground = `radial-gradient(50% 50% at 50% 50%, ${goal.goalColor}33 89.585%, ${
    goal.timeBudget.perDay != null ? "transparent" : goal.goalColor
  } 100%)`;
  const outerBorderStyle =
    goal.timeBudget.perDay == null ? `1px solid ${goal.goalColor}` : `2px dashed ${goal.goalColor}`;

  const innerBorderColor = hasSubGoals ? goal.goalColor : "transparent";

  const renderDots = (color: string) => {
    return [...Array(3)].map(() => <span key={goal.id} style={{ backgroundColor: color }} />);
  };

  return (
    <div key={String(`goal-${goal.id}`)} className={`user-goal${darkModeStatus ? "-dark" : ""}`}>
      <div
        className="user-goal-main"
        style={{
          ...(goal.typeOfGoal !== "myGoal" && goal.parentGoalId === "root" ? { width: "80%" } : {}),
        }}
      >
        <div
          style={{
            padding: "20px 0",
            marginLeft: 20,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
          onClickCapture={(e) => {
            handleDropDown(e);
          }}
        >
          <div className="goal-dropdown">
            <div
              className="goal-dd-outer"
              style={{
                background: outerBackground,
                border: outerBorderStyle,
              }}
            >
              <div className="goal-dd-inner" style={{ borderColor: innerBorderColor }}>
                {goal.newUpdates && <NotificationSymbol color={goal.goalColor} />}
              </div>
            </div>
          </div>
          {isActionVisible && <div className="goal-menu-dots">{renderDots(goal.goalColor)}</div>}
        </div>
        <div aria-hidden className="goal-tile" onClick={handleGoalClick}>
          <div className="goal-title">
            {replacedString.split(" ").map((ele, index) => {
              const replacedUrls = Array.from(ele.matchAll(/zURL-(\d+)/g));
              if (replacedUrls.length) {
                return (
                  <React.Fragment key={`${goal.id}-${ele}-replacedUrlsFragment`}>
                    {replacedUrls.map(([url, digitStr]) => {
                      const urlIndex = Number.parseInt(digitStr, 10);
                      const originalUrl = urlsWithIndexes[urlIndex];
                      const summarizedUrl = summarizeUrl(originalUrl);
                      return (
                        <span
                          key={`${goal.id}-${ele}-${url}`}
                          style={{ cursor: "pointer", textDecoration: "underline" }}
                          onClickCapture={() => {
                            window.open(originalUrl, "_blank");
                          }}
                        >
                          {index === 0 ? summarizedUrl : ` ${summarizedUrl}`}
                        </span>
                      );
                    })}
                  </React.Fragment>
                );
              }
              return <span key={`${goal.id}-${ele}`}>{index === 0 ? ele : ` ${ele}`}</span>;
            })}
            &nbsp;
            {goal.link && (
              <a
                className="goal-link"
                href={goal.link}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                rel="noreferrer"
              >
                URL
              </a>
            )}
          </div>
          {showActions.open === goal.id && showActions.click > 0 && (
            <p className="goal-desc">
              <GoalSent goal={goal} />
            </p>
          )}
        </div>
      </div>
      {!showPartnerMode && goal.participants?.length > 0 && <GoalAvatar goal={goal} />}
    </div>
  );
};

export default MyGoal;
