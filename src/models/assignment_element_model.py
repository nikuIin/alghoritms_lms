from datetime import datetime

from sqlalchemy import (
    UUID,
    Column,
    DateTime,
    ForeignKey,
    Identity,
    Integer,
    SmallInteger,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from models.base_model import Base


class ElementType(Base):
    __tablename__ = "element_type"

    element_type_id = Column(
        Integer, Identity(), primary_key=True
    )  # autoincrement
    name = Column(String(255), nullable=False)

    # Relationship to Element (one-to-many)
    elements = relationship("Element", back_populates="element_type")

    def __repr__(self):
        return f"<ElementType(element_type_id={self.element_type_id}, name='{self.name}')>"


class Element(Base):
    __tablename__ = "element"

    element_id = Column(Integer, Identity(), primary_key=True)  # autoincrement
    name = Column(String(255), nullable=False)
    element_type_id = Column(
        Integer, ForeignKey("element_type.element_type_id"), nullable=False
    )
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # Relationship to ElementType (many-to-one)
    element_type = relationship("ElementType", back_populates="elements")

    # Relationship to AssignmentElement (one-to-many)
    assignment_elements = relationship(
        "AssignmentElement", back_populates="element"
    )

    def __repr__(self):
        return f"<Element(element_id={self.element_id}, name='{self.name}')>"


class GameFieldAssignment(Base):
    __tablename__ = "game_field_assignment"

    assignment_id = Column(UUID(as_uuid=True), primary_key=True)
    field_width = Column(SmallInteger, nullable=False)
    field_height = Column(SmallInteger, nullable=False)
    start_x = Column(SmallInteger, nullable=False)
    start_y = Column(SmallInteger, nullable=False)
    end_x = Column(SmallInteger, nullable=False)
    end_y = Column(SmallInteger, nullable=False)

    # Relationship to AssignmentElement (one-to-many)
    assignment_elements = relationship(
        "AssignmentElement", back_populates="game_field_assignment"
    )

    def __repr__(self):
        return f"<GameFieldAssignment(assignment_id={self.assignment_id}, field_width={self.field_width}, field_height={self.field_height})>"


class AssignmentElement(Base):
    __tablename__ = "assignment_element"

    element_id = Column(
        Integer, ForeignKey("element.element_id"), primary_key=True
    )
    assignment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("game_field_assignment.assignment_id"),
        primary_key=True,
    )
    pos_x = Column(SmallInteger, nullable=False)
    pos_y = Column(SmallInteger, nullable=False)

    # Relationships (many-to-one)
    element = relationship("Element", back_populates="assignment_elements")
    game_field_assignment = relationship(
        "GameFieldAssignment", back_populates="assignment_elements"
    )

    def __repr__(self):
        return f"<AssignmentElement(element_id={self.element_id}, assignment_id={self.assignment_id}, pos_x={self.pos_x}, pos_y={self.pos_y})>"


class Action(Base):
    __tablename__ = "action"

    action_id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    x_value_changes = Column(SmallInteger, nullable=False)
    y_value_changes = Column(SmallInteger, nullable=False)


class AssignmentAction(Base):
    __tablename__ = "assignment_action"
    assignment_id = Column(UUID(as_uuid=True), primary_key=True)
    action_id = Column(Integer, primary_key=True)

    __table_args__ = (
        UniqueConstraint(
            "assignment_id",
            "action_id",
        ),
    )
