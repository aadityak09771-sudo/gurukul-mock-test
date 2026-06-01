import { Navigate, useParams } from "react-router-dom";

const TestEntryRoute = () => {

  const { id } = useParams();

  return <Navigate to={`/start/${id}`} replace />;

};

export default TestEntryRoute;