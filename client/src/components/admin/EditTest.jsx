import React, {
  useEffect,
  useState
} from "react";

import {
  useParams,
  useNavigate
} from "react-router-dom";

import API from "../../services/api";

import CreateTest from "./CreateTest";

const EditTest = () => {

  const { id } = useParams();

  const navigate = useNavigate();

  const [testData, setTestData] =
    useState(null);

  // ================= FETCH =================

  useEffect(() => {

    fetchTest();

  }, []);

  const fetchTest = async () => {

    try {

      const res = await API.get(
        `/tests/${id}`
      );

      setTestData(res.data);

    } catch (err) {

      console.error(err);

    }

  };

  // ================= UPDATE =================

  const handleUpdate = async (
    updatedData
  ) => {

    try {

      await API.put(
        `/tests/${id}`,
        updatedData
      );

      alert(
        "Test updated successfully ✅"
      );

      // ✅ Trigger Auto-Email if going Live
      if (updatedData.status === "live" && updatedData.isPrivate && updatedData.allowedStudents?.length > 0) {
        const confirmSend = window.confirm("This is a private test. Do you want to automatically email the secure test link to all allowed students now?");
        if (confirmSend) {
          const inviteRes = await API.post('/tests/send-invites', { testId: id });
          alert(inviteRes.data.msg);
        }
      }

      navigate("/admin/manage-tests");

    } catch (err) {

      console.error(err);

      alert("Update failed ❌");

    }

  };

  if (!testData) {
    return <h2>Loading...</h2>;
  }

  return (

    <CreateTest
      editMode={true}
      initialData={testData}
      onSubmit={handleUpdate}
    />

  );

};

export default EditTest;