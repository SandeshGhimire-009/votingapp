import React from 'react';

const PollForm = () => {
  return (
    <section className="admin-poll-form">
      <div className="container">
        <h1>Poll Form</h1>
        <form>
          <div className="form-group">
            <label>Title</label>
            <input type="text" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea></textarea>
          </div>
          <button type="submit" className="btn btn-primary">Save</button>
        </form>
      </div>
    </section>
  );
};

export default PollForm;
