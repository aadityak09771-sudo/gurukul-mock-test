import "./Button.css";

const Button = ({ text, type = "primary", onClick, icon }) => {
  return (
    <button className={`btn ${type}`} onClick={onClick}>
      {icon && <span className="btn-icon">{icon}</span>}
      {text}
    </button>
  );
};

export default Button;