export default function GetUserName(){

   const result = localStorage.getItem("user-Name");
  return result? result :null;
}