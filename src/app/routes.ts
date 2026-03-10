import { createBrowserRouter } from "react-router";
import Root from "./pages/Root";
import Home from "./pages/Home";
import StudentRegistration from "./pages/StudentRegistration";
import JudgeScoring from "./pages/JudgeScoring";
import Ranking from "./pages/Ranking";
import RankingOnly from "./pages/RankingOnly";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        index: true,
        Component: Home,
      },
      {
        path: "registration",
        Component: StudentRegistration,
      },
      {
        path: "judge",
        Component: JudgeScoring,
      },
      {
        path: "ranking",
        Component: Ranking,
      },
      {
        path: "ranking-only",
        Component: RankingOnly,
      },
    ],
  },
]);