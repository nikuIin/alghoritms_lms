from sqlalchemy import text

GET_COURSES = text(
    """
    select
        course_id,
        name,
        owner,
        status_id,
        description
    from course
    """
)

GET_USER_COURSES = text(
    """
    select
      c.course_id,
      c.name,
      c.owner,
      c.status_id
    from course c
    join course_user using (course_id)
    join "user" using (user_login)
    where user_login = :user_login;
    """
)

IS_COURSE_EXISTS = text(
    """
    select 1
    from course
    where course_id = :course_id
    """
)

GET_COURSE_BY_ID = text(
    """
    select
        course_id,
        name,
        owner,
        status_id,
        coalesce(description, '')
    from course
    where course_id = :course_id
    """
)

GET_COURSES_BY_OWNER = text(
    """
    select
        course_id,
        name,
        owner,
        status_id,
        coalesce(description, '')
    from course
    where owner = :owner 
    """
)

GET_USERS_ON_COURSE = text(
    """
    select
        course_id,
        user_login
    from course_user
    where course_id = :course_id
    """
)

CREATE_COURSE = text(
    """
    insert into course (name, owner, status_id, description) values
    (:name, :owner, :status_id, :description)
    """
)

ADD_USER_TO_COURSE = text(
    """
    insert into course_user (course_id, user_login)
    values (:course_id, :user_login)
    on conflict do nothing
    """
)

ADD_USERS_TO_COURSE = """
    insert into course_user (course_id, user_login)
    values
    """

SELECT_COURSE_USERS = text(
    """
    select 
      user_login
    from course_user
    where course_id = :course_id 
    """
)
