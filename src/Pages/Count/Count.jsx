import CountItem from "../../Components/CountItem/countItem"
import "./Count.css"
export const Count = () => {
  return (

<div className="fja count-container">
  <div className="count-container-top fja">
    <span>Trusted by over 1 user worldwide</span>
  </div>
  <div className="count-container-bottom fja">
<CountItem count={"1"} thing={"Users"}/>
<div style={{borderLeft:"0.1px solid rgba(0,0,0,0.25)",borderRight:"0.1px solid rgba(0,0,0,0.25)",width:"100%"}}>
<CountItem count={"100"} thing={"Polls"}/>
</div>
<CountItem count={"5000"} thing={"Votes"}/>

  </div>

  
</div>
  )
}