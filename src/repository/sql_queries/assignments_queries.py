from sqlalchemy import text

IS_ASSIGNMENT_EXISTS = text(
    """
    select exists(
    select 1
    from assignment
    where assignment_id = :assignment_uuid
    """
)

GET_COURSE_ASSIGNMENTS = text(
    """
    select
        assignment_id,
        course_id,
        name,
        status_id,
        description,
        field_width,
        field_height,
        start_x,
        start_y,
        end_x,
        end_y
    from assignment
    left join game_field_assignment using (assignment_id)
    where course_id = :course_uuid
    """
)


GET_GAME_ASSIGNMENT_BY_ID = text(
    """
    select
        assignment_id,
        name,
        status_id,
        description,
        field_width,
        field_height,
        start_x,
        start_y,
        end_x,
        end_y
    from assignment
    left join game_field_assignment using (assignment_id)
    """
)

GET_FIELD_ELEMENTS = text(
    """
    select
        name,
        element_type_id,
        pos_x,
        pos_y
    from element
    left join assignment_element using(assignment_id)
    where assignment_id = :assignment_id 
    """
)

CREATE_ASSIGNMENT = text(
    """
    insert into assignment( 
     name,
     course_id,
     assignment_type_id,
     status_id,
     description
    )
    values (      
        :name,      
        :course_id, 
        :assignment_type_id,
        :status_id, 
        :description
    )
    returning *
    """
)

CREATE_GAME_ASSIGNMENT = text(
    """
    insert into game_field_assignment( 
    assignment_id,
    field_width,
    field_height,
    start_x,
    start_y,
    end_x,
    end_y 
    )
    values (      
        :assignment_id,
        :field_width,
        :field_height,
        :start_x,
        :start_y,
        :end_x,
        :end_y
    )
    returning *
    """
)


UPDATE_ASSIGNMENT = text(
    """
    update assignment
    set name = :name, 
    course_id = :course_id, 
    assignment_type_id = :assignment_type_id, 
    status_id = :status_id, 
    description = :description
    where 
    assignment_id = :assignment_id 
    returning *
    """
)

SAFE_DELETE_ASSIGNMENT = text(
    """
    with assignment_delete as (
            delete from assignment
            where assignment_id = :assignment_id 
            returning *
    )
    insert into deleted_assignment
    table assignment_delete;
    """
)

GET_TOTAL_INFO_ABOUT_ASSIGNMENT = text(
    """
    select
      assignment_id,
      assignment_type_id,
      course_id,
      a.name,
      description,
      field_width,
      field_height,
      start_x,
      start_y,
      end_x,
      end_y,
      status_id,
      json_agg(
        jsonb_build_array(
          'action_id',
          action_id,
          'name',
          act.name,
          'x_changes',
          x_value_changes,
          'y_changes',
          y_value_changes
        )
      ) as actions,
      json_agg(
        jsonb_build_object(
          'element_id',
          element_id,
          'name',
          el.name,
          'element_type_id',
          element_type_id,
          'pos_x',
          pos_x,
          'pos_y',
          pos_y
        )
      ) as elements
    from assignment a
    left join game_field_assignment gfa using(assignment_id)
    left join assignment_element using (assignment_id)
    left join element as el using (element_id)
    left join assignment_action using (assignment_id)
    left join action act using (action_id)
    where assignment_id = :assignment_id 
    group by assignment_id, gfa.assignment_id;
    """
)

INSERT_GAME_ELEMENT = text(
    """
    insert into assignment_element
    (element_id, assignment_id, pos_x, pos_y)
    values
    """
)

GET_ASSIGNMENT_ACTIONS = text(
    """
    select
      assignment_id,
      json_agg(
        jsonb_build_array(
          'action_id',
          action_id,
          'name',
          act.name,
          'x_changes',
          x_value_changes,
          'y_changes',
          y_value_changes
        )
      ) as actions
    from assignment a
    left join assignment_action using(assignment_id)
    left join action act using (action_id)
    where assignment_id = :assignment_id  
    group by assignment_id;
    """
)
