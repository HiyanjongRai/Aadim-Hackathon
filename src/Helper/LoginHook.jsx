export default function IsLogin(){

   const result = localStorage.getItem("authToken");
  return result? result :null;
} 