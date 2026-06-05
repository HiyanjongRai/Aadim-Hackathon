import "./countItem.css"
 const countItem = ({ count, thing }) => {
  return (
<div className="countItem-container">
    <div className="countItem-container-top fja">

<span>{count}+</span>
    </div>
    <div className="countItem-container-bottom fja">

<span>{thing}</span>

    </div>
</div>
  )
}
export default countItem;