import { Outlet, useLocation } from "react-router-dom";
import TopNavbar from "../Components/TopNavbar";

export const  Layout = () => {
  const location = useLocation();
return(
  <>
       <TopNavbar />
      <Outlet />

  </>
)
}