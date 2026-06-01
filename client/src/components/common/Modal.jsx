import "./Modal.css";

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="modal-content">
          {children}
        </div>

      </div>
    </div>
  );
};

export default Modal;