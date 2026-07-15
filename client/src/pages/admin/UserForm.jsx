import React from 'react';

const UserForm = () => {
  return (
    <section className="admin-user-form">
      <div className="container">
        <h1>User Form</h1>
        <form>
          <div className="form-group">
            <label>Name</label>
            <input type="text" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" />
          </div>
          <button type="submit" className="btn btn-primary">Save</button>
        </form>
      </div>
    </section>
  );
};

export default UserForm;
