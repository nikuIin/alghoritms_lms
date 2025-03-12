from sqlalchemy import text
from core.config import STATUS_OF_ELEMENTS_SETTINGS

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

GET_USER_COURSES = text(
    """
    select
        course_id,
        name,
        owner,
        status_id
        coalesce(description, '')
    from course
    join course_user using(course_id)
    where user_login = :user_login
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
