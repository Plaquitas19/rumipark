const Notification = ({ message, type, onClose }) => {
  const backgroundColor = type === 'success' ? 'bg-green-500' :
                          type === 'error'   ? 'bg-red-500' : 
                          'bg-yellow-500';  // info type

  return (
    <div className={`fixed top-5 right-5 max-w-xs w-full p-4 rounded-lg text-white ${backgroundColor} flex items-center`} role="alert">
      <span className="mr-3">{message}</span>
      <button
        className="text-white hover:text-gray-200"
        onClick={onClose}
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

export default Notification;
