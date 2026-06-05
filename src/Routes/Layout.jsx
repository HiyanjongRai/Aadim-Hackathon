import { Outlet } from "react-router-dom";
import TopNavbar from "../Components/TopNavbar";

export const  Layout = () => {
return(
  <>
       <TopNavbar />
      <Outlet />

  </>
)
}