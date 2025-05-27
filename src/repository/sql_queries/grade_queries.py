from sqlalchemy import text

# add new grade to student (student login) on some assignment
ADD_GRADE = text(
    """
    insert into grade (user_login, assignment_id, grade)
    values (:user_login, :assignment_id, :grade)
    on conflict (user_login, assignment_id)
    do update set grade = :grade;
    """
)

UPDATE_GRADE = text(
    """
    update grade set grade = :grade
    where assignment_id = :assignment_id
          and user_login = :user_login;
    """
)

DELETE_GRADE = text(
    """
    delete from grade
    where assignment_id = :assignment_id
          and user_login = :user_login;
    """
)

SELECT_GRADE = text(
    """
    select grade
    from grade
    where user_login = :user_login
          and assignment_id = :assignment_id;
    """
)

SELECT_ALL_GRADES = text(
    """
    select
      user_login,
      grade,
      assignment_id,
      course_id,
      assignment.name as assignment_name
    from grade
    join assignment using(assignment_id);
    """
)

SELECT_USER_GRADES = text(
    """
    select
        user_login,
        grade,
        assignment_id,
        course_id,
        assignment.name as assignment_name
    from grade
    join assignment using(assignment_id)
    where user_login = :user_login;
    """
)
