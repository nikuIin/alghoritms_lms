from sqlalchemy import text


CREATE_SOLUTION = text(
    """
    insert into solution(
        user_login, 
        assignment_id,
        answer,
        solution_status_id
    )
    values (:user_login, :assignment_id, :answer, :solution_status)
    returning *
    """
)


GET_SOLUTION = text(
    """ 
    select
      solution_id,
      assignment_id,
      solution_status_id,
      answer,
      feedback,
      is_correct
    from solution
    where assignment_id = :assignment_id
    order by solution_id
    limit 1;
    """
)

GET_SOLUTION_BY_ID = text(
    """
    select
      solution_id,
      assignment_id,
      user_login,
      solution_status_id,
      answer,
      feedback,
      is_correct
    from solution
    where solution_id = :solution_id 
    """
)

UPDATE_SOLUTION = text(
    """
    update solution
    set
      feedback = :feedback,
      answer = :answer,
      is_correct = :is_correct,
      solution_status_id = :solution_status_id,
      check_at = :check_at
    where solution_id = :solution_id
    returning *;
    """
)


GET_ACTION = text(
    """
    select
        action_id,
        x_value_changes,
        y_value_changes,
        name as action_name
    from action
    where action_id = :action_id
    """
)
