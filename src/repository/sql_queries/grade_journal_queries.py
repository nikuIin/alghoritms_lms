from sqlalchemy import text


SET_GRADE = text(
    """
    insert into grade_journal (grade_id, assignment_id, user_login)
    values (:grade_id, :assignment_id, :user_login)
    returning *
    """
)

UPDATE_GRADE = text(
    """
    update grade_journal
    set grade = :grade
    where assignment_id = :assignment_id
    returning *
    """
)


GET_GRADE = text(
    """
    select grade
    from grade_journal
    where assignment_id = :assignment_id
    """
)

GET_JOURNAL = text(
    """
    select
      grade_id,
      assignment_id,
      user_login
    from grade_journal
    """
)
